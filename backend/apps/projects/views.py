import uuid

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsWorkspaceMemberOrAdmin
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
    return membership.role in ('admin', 'member')


class ProjectListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = ProjectSerializer

    def get_queryset(self):
        workspace_ids = [
            m.workspaceId
            for m in WorkspaceMemberDocument.objects(userId=str(self.request.user.id), status='accepted')
        ]
        qs = ProjectDocument.objects(workspaceId__in=workspace_ids)

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


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    lookup_field = 'id'
    lookup_url_kwarg = 'pk'

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProjectDetailSerializer
        return ProjectSerializer

    def get_queryset(self):
        workspace_ids = [
            m.workspaceId
            for m in WorkspaceMemberDocument.objects(userId=str(self.request.user.id), status='accepted')
        ]
        return ProjectDocument.objects(workspaceId__in=workspace_ids)

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


class SpaceListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = SpaceSerializer

    def get_queryset(self):
        workspace_ids = [
            m.workspaceId
            for m in WorkspaceMemberDocument.objects(userId=str(self.request.user.id), status='accepted')
        ]
        qs = SpaceDocument.objects(workspaceId__in=workspace_ids)

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


class SpaceDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = SpaceSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'pk'

    def get_queryset(self):
        workspace_ids = [
            m.workspaceId
            for m in WorkspaceMemberDocument.objects(userId=str(self.request.user.id), status='accepted')
        ]
        return SpaceDocument.objects(workspaceId__in=workspace_ids)


class FolderListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = FolderSerializer

    def get_queryset(self):
        workspace_ids = [
            m.workspaceId
            for m in WorkspaceMemberDocument.objects(userId=str(self.request.user.id), status='accepted')
        ]
        qs = FolderDocument.objects(workspaceId__in=workspace_ids)

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


class FolderDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = FolderSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'pk'

    def get_queryset(self):
        workspace_ids = [
            m.workspaceId
            for m in WorkspaceMemberDocument.objects(userId=str(self.request.user.id), status='accepted')
        ]
        return FolderDocument.objects(workspaceId__in=workspace_ids)


class ProjectHierarchyView(APIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]

    def get(self, request):
        workspace_id = request.query_params.get('workspace')
        if not workspace_id:
            return Response({'error': 'workspace query parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        member = WorkspaceMemberDocument.objects(
            workspaceId=str(workspace_id),
            userId=str(request.user.id),
            status='accepted',
        ).first()
        if not member:
            return Response({'error': 'Workspace not found or inaccessible.'}, status=status.HTTP_404_NOT_FOUND)

        spaces = SpaceDocument.objects(workspaceId=str(workspace_id))
        serializer = HierarchySpaceSerializer(spaces, many=True, context={'request': request})
        return Response(serializer.data)
