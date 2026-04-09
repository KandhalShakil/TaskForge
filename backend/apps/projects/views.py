from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsWorkspaceMemberOrAdmin
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from apps.workspaces.models import Workspace, WorkspaceMember
from .models import Project, ProjectMember
from .serializers import ProjectSerializer, ProjectDetailSerializer, ProjectMemberSerializer

User = get_user_model()


class ProjectListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = ProjectSerializer

    def get_queryset(self):
        qs = Project.objects.filter(
            workspace__members__user=self.request.user,
            workspace__members__status=WorkspaceMember.Status.ACCEPTED
        ).select_related('owner', 'workspace').prefetch_related('members', 'tasks')

        workspace_id = self.request.query_params.get('workspace')
        if workspace_id:
            qs = qs.filter(workspace_id=workspace_id)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs.distinct()

    def perform_create(self, serializer):
        workspace_id = self.request.data.get('workspace')
        workspace = get_object_or_404(Workspace, id=workspace_id)
        if not WorkspaceMember.objects.filter(
            workspace=workspace, 
            user=self.request.user, 
            role__in=[WorkspaceMember.Role.ADMIN, WorkspaceMember.Role.MEMBER],
            status=WorkspaceMember.Status.ACCEPTED
        ).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to create projects in this workspace.")
        serializer.save()


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProjectDetailSerializer
        return ProjectSerializer

    def get_queryset(self):
        return Project.objects.filter(
            workspace__members__user=self.request.user,
            workspace__members__status=WorkspaceMember.Status.ACCEPTED
        ).select_related('owner', 'workspace').prefetch_related('members__user', 'tasks')

    def destroy(self, request, *args, **kwargs):
        project = self.get_object()
        # Only Workspace Admins or Project Owners can delete projects
        is_workspace_admin = WorkspaceMember.objects.filter(
            workspace=project.workspace,
            user=request.user,
            role=WorkspaceMember.Role.ADMIN
        ).exists()
        
        if project.owner != request.user and not is_workspace_admin:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only Project Owners or Workspace Admins can delete this project.")
            
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectMemberListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = ProjectMemberSerializer

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return ProjectMember.objects.filter(
            project_id=project_id,
        ).select_related('user', 'project').all()


class AddProjectMemberView(APIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]

    def post(self, request, project_id):
        project = get_object_or_404(
            Project, id=project_id, workspace__members__user=request.user
        )
        serializer = ProjectMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_id = serializer.validated_data['user_id']
        user = get_object_or_404(User, id=user_id)

        # Ensure user is a workspace member first
        if not project.workspace.members.filter(user=user).exists():
            return Response(
                {'error': 'User must be a workspace member first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        member, created = ProjectMember.objects.get_or_create(
            project=project, user=user,
            defaults={'role': serializer.validated_data.get('role', ProjectMember.Role.MEMBER)}
        )
        if not created:
            return Response({'error': 'User is already a project member.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProjectMemberSerializer(member).data, status=status.HTTP_201_CREATED)


class RemoveProjectMemberView(APIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]

    def delete(self, request, project_id, user_id):
        project = get_object_or_404(Project, id=project_id, workspace__members__user=request.user)
        member = get_object_or_404(ProjectMember, project=project, user_id=user_id)
        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
