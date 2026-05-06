import uuid

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsWorkspaceMemberOrAdmin, CompanyTenantMixin
from apps.users.documents import UserDocument
from apps.workspaces.documents import WorkspaceDocument, WorkspaceMemberDocument

from .documents import FolderDocument, ProjectDocument, ProjectMemberDocument, SpaceDocument
from .serializers import (
    FolderSerializer,
    HierarchySpaceSerializer,
    ProjectDetailSerializer,
    ProjectMemberSerializer,
    ProjectSerializer,
    SpaceSerializer,
)


def _is_workspace_editor(workspace_id, user_id):
    membership = WorkspaceMemberDocument.objects(
        workspaceId=str(workspace_id),
        userId=str(user_id),
        status='accepted',
    ).first()
    if not membership:
        return False
    # RBAC: Only Admins can manage the structural elements (Spaces, Folders, Projects)
    return membership.role == 'admin'


class ProjectListCreateView(CompanyTenantMixin, generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = ProjectSerializer
    document_class = ProjectDocument

    def get_queryset(self):
        qs = super().get_queryset()

        workspace_id = self.request.query_params.get('workspace')
        if workspace_id:
            qs = qs.filter(workspaceId=str(workspace_id))

        space_id = self.request.query_params.get('space')
        if space_id:
            qs = qs.filter(spaceId=str(space_id))

        folder_id = self.request.query_params.get('folder')
        if folder_id is not None:
            folder_id = str(folder_id).strip()
            if folder_id in ('', 'null', 'None'):
                qs = qs.filter(folderId__in=['', None])
            else:
                qs = qs.filter(folderId=folder_id)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs

    def perform_create(self, serializer):
        workspace_id = self.request.data.get('workspace')
        workspace = WorkspaceDocument.objects(id=str(workspace_id)).first()
        if not workspace:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({'workspace': 'Workspace not found.'})

        if not _is_workspace_editor(workspace.id, self.request.user.id):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied('You do not have permission to create projects in this workspace.')
        serializer.save()


class ProjectDetailView(CompanyTenantMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    document_class = ProjectDocument
    lookup_field = 'id'
    lookup_url_kwarg = 'pk'

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProjectDetailSerializer
        return ProjectSerializer

    def destroy(self, request, *args, **kwargs):
        project = self.get_object()
        is_workspace_admin = WorkspaceMemberDocument.objects(
            workspaceId=str(project.workspaceId),
            userId=str(request.user.id),
            role='admin',
            status='accepted',
        ).first()

        if str(project.ownerId) != str(request.user.id) and not is_workspace_admin:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied('Only Project Owners or Workspace Admins can delete this project.')

        ProjectMemberDocument.objects(projectId=str(project.id)).delete()
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectMemberListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = ProjectMemberSerializer

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return ProjectMemberDocument.objects(projectId=str(project_id))


class AddProjectMemberView(APIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]

    def post(self, request, project_id):
        project = ProjectDocument.objects(id=str(project_id)).first()
        if not project:
            return Response({'error': 'Project not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not WorkspaceMemberDocument.objects(
            workspaceId=str(project.workspaceId),
            userId=str(request.user.id),
            status='accepted',
        ).first():
            return Response({'error': 'Not allowed to modify this project.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ProjectMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_id = serializer.validated_data['user_id']
        user = UserDocument.objects(id=str(user_id)).first()
        if not user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Requirement 7 & 8: Only users from SAME company can be added.
        if str(user.companyId) != str(request.user.companyId):
            return Response({'error': 'You can only add users from your own company.'}, status=status.HTTP_403_FORBIDDEN)

        if not WorkspaceMemberDocument.objects(
            workspaceId=str(project.workspaceId),
            userId=str(user.id),
            status='accepted',
        ).first():
            return Response({'error': 'User must be a workspace member first.'}, status=status.HTTP_400_BAD_REQUEST)

        existing = ProjectMemberDocument.objects(projectId=str(project.id), userId=str(user.id)).first()
        if existing:
            return Response({'error': 'User is already a project member.'}, status=status.HTTP_400_BAD_REQUEST)

        member = ProjectMemberDocument(
            id=str(uuid.uuid4()),
            projectId=str(project.id),
            userId=str(user.id),
            role=serializer.validated_data.get('role', 'member'),
        )
        member.save()
        return Response(ProjectMemberSerializer(member).data, status=status.HTTP_201_CREATED)


class RemoveProjectMemberView(APIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]

    def delete(self, request, project_id, user_id):
        project = ProjectDocument.objects(id=str(project_id)).first()
        if not project:
            return Response({'error': 'Project not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not WorkspaceMemberDocument.objects(
            workspaceId=str(project.workspaceId),
            userId=str(request.user.id),
            status='accepted',
        ).first():
            return Response({'error': 'Not allowed to modify this project.'}, status=status.HTTP_403_FORBIDDEN)

        member = ProjectMemberDocument.objects(projectId=str(project.id), userId=str(user_id)).first()
        if not member:
            return Response({'error': 'Project member not found.'}, status=status.HTTP_404_NOT_FOUND)

        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SpaceListCreateView(CompanyTenantMixin, generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = SpaceSerializer
    document_class = SpaceDocument

    def get_queryset(self):
        qs = super().get_queryset()
        workspace_id = self.request.query_params.get('workspace')
        if workspace_id:
            qs = qs.filter(workspaceId=str(workspace_id))
        return qs

    def perform_create(self, serializer):
        workspace_id = self.request.data.get('workspace')
        workspace = WorkspaceDocument.objects(id=str(workspace_id)).first()
        if not workspace:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({'workspace': 'Workspace not found.'})

        if not _is_workspace_editor(workspace.id, self.request.user.id):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied('You do not have permission to create spaces in this workspace.')
        serializer.save()


class SpaceDetailView(CompanyTenantMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = SpaceSerializer
    document_class = SpaceDocument
    lookup_field = 'id'
    lookup_url_kwarg = 'pk'


class FolderListCreateView(CompanyTenantMixin, generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = FolderSerializer
    document_class = FolderDocument

    def get_queryset(self):
        qs = super().get_queryset()
        workspace_id = self.request.query_params.get('workspace')
        if workspace_id:
            qs = qs.filter(workspaceId=str(workspace_id))

        space_id = self.request.query_params.get('space')
        if space_id:
            qs = qs.filter(spaceId=str(space_id))
        return qs

    def perform_create(self, serializer):
        workspace_id = self.request.data.get('workspace')
        workspace = WorkspaceDocument.objects(id=str(workspace_id)).first()
        if not workspace:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({'workspace': 'Workspace not found.'})

        if not _is_workspace_editor(workspace.id, self.request.user.id):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied('You do not have permission to create folders in this workspace.')
        serializer.save()


class FolderDetailView(CompanyTenantMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = FolderSerializer
    document_class = FolderDocument
    lookup_field = 'id'
    lookup_url_kwarg = 'pk'


class ProjectHierarchyView(APIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]

    def get(self, request):
        workspace_id = request.query_params.get('workspace')
        if not workspace_id:
            return Response({'error': 'workspace query parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        workspace = WorkspaceDocument.objects(id=str(workspace_id)).first()
        if not workspace or str(workspace.companyId) != str(request.user.companyId):
            return Response({'error': 'Workspace not found or inaccessible.'}, status=status.HTTP_404_NOT_FOUND)

        # Bulk fetch all hierarchy components for the workspace
        spaces = list(SpaceDocument.objects(workspaceId=str(workspace_id), companyId=request.user.companyId).order_by('order'))
        folders = list(FolderDocument.objects(workspaceId=str(workspace_id)).order_by('order'))
        projects = list(ProjectDocument.objects(workspaceId=str(workspace_id)).order_by('order'))

        # Group data in memory for the serializers to avoid N+1 queries
        space_folders = {}
        for folder in folders:
            s_id = str(folder.spaceId)
            if s_id not in space_folders:
                space_folders[s_id] = []
            space_folders[s_id].append(folder)

        folder_projects = {}
        root_projects = {} # Projects with space but no folder
        
        for project in projects:
            p_folder_id = str(project.folderId) if getattr(project, 'folderId', None) else ''
            p_space_id = str(project.spaceId) if getattr(project, 'spaceId', None) else ''
            
            if p_folder_id:
                if p_folder_id not in folder_projects:
                    folder_projects[p_folder_id] = []
                folder_projects[p_folder_id].append(project)
            elif p_space_id:
                if p_space_id not in root_projects:
                    root_projects[p_space_id] = []
                root_projects[p_space_id].append(project)

        context = {
            'request': request,
            'space_folders': space_folders,
            'folder_projects': folder_projects,
            'root_projects': root_projects
        }

        serializer = HierarchySpaceSerializer(spaces, many=True, context=context)
        return Response(serializer.data)
