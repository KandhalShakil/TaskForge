from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsWorkspaceAdmin, IsWorkspaceMemberOrAdmin
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import Workspace, WorkspaceMember
from .serializers import (
    WorkspaceSerializer, WorkspaceDetailSerializer, WorkspaceMemberSerializer
)

User = get_user_model()


class WorkspaceListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return WorkspaceSerializer

    def get_queryset(self):
        return Workspace.objects.filter(
            members__user=self.request.user,
            members__status=WorkspaceMember.Status.ACCEPTED
        ).select_related('owner').prefetch_related('members__user', 'projects', 'tasks').distinct()

    def perform_create(self, serializer):
        user = self.request.user
        
        # Enforce RBAC: Only Company and Admin accounts can create workspaces.
        # Employees are restricted from creating workspaces globally.
        if hasattr(user, 'user_type'):
            if user.user_type == User.UserType.EMPLOYEE and not user.is_staff:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Only Company or Admin accounts can create workspaces.")
            
        serializer.save()


class WorkspaceDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceDetailSerializer

    def get_queryset(self):
        return Workspace.objects.filter(
            members__user=self.request.user,
            members__status=WorkspaceMember.Status.ACCEPTED
        ).select_related('owner').prefetch_related('members__user')

    def destroy(self, request, *args, **kwargs):
        workspace = self.get_object()
        if workspace.owner != request.user:
            return Response(
                {'error': 'Only the workspace owner can delete it.'},
                status=status.HTTP_403_FORBIDDEN
            )
        workspace.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def update(self, request, *args, **kwargs):
        workspace = self.get_object()
        if not WorkspaceMember.objects.filter(workspace=workspace, user=request.user, role=WorkspaceMember.Role.ADMIN).exists():
            return Response(
                {'error': 'Only admins can update workspace.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)


class WorkspaceMemberListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = WorkspaceMemberSerializer

    def get_queryset(self):
        workspace_id = self.kwargs['workspace_id']
        return WorkspaceMember.objects.filter(
            workspace_id=workspace_id,
        ).select_related('user', 'workspace').all()


class AddWorkspaceMemberView(APIView):
    permission_classes = [IsAuthenticated, IsWorkspaceAdmin]

    def post(self, request, workspace_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        serializer = WorkspaceMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_id = serializer.validated_data['user_id']
        user = get_object_or_404(User, id=user_id)

        member, created = WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            user=user,
            defaults={'role': serializer.validated_data.get('role', WorkspaceMember.Role.MEMBER)}
        )
        
        if not created:
            if member.status == WorkspaceMember.Status.PENDING:
                return Response({'error': f'An invitation for {user.email} is already pending.'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'error': f'{user.email} is already a member of this workspace.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(WorkspaceMemberSerializer(member).data, status=status.HTTP_201_CREATED)


class RemoveWorkspaceMemberView(APIView):
    permission_classes = [IsAuthenticated, IsWorkspaceAdmin]

    def delete(self, request, workspace_id, user_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        member = get_object_or_404(WorkspaceMember, workspace=workspace, user_id=user_id)
        if member.user == workspace.owner:
            return Response({'error': 'Cannot remove the workspace owner.'}, status=status.HTTP_400_BAD_REQUEST)
        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UpdateMemberRoleView(APIView):
    permission_classes = [IsAuthenticated, IsWorkspaceAdmin]

    def patch(self, request, workspace_id, user_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        member = get_object_or_404(WorkspaceMember, workspace=workspace, user_id=user_id)
        role = request.data.get('role')
        if role not in [r.value for r in WorkspaceMember.Role]:
            return Response({'error': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)
        member.role = role
        member.save()
        return Response(WorkspaceMemberSerializer(member).data)

class MyInvitationsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceMemberSerializer

    def get_queryset(self):
        return WorkspaceMember.objects.filter(
            user=self.request.user,
            status=WorkspaceMember.Status.PENDING
        ).select_related('workspace', 'workspace__owner')

class RespondToInvitationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, member_id):
        action = request.data.get('action')
        member = get_object_or_404(
            WorkspaceMember, 
            id=member_id, 
            user=request.user, 
            status=WorkspaceMember.Status.PENDING
        )

        if action == 'accept':
            member.status = WorkspaceMember.Status.ACCEPTED
            member.save()
            return Response(WorkspaceMemberSerializer(member).data)
        elif action == 'decline':
            member.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        
        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)
