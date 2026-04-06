from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
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
            members__user=self.request.user
        ).select_related('owner').prefetch_related('members').distinct()


class WorkspaceDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceDetailSerializer

    def get_queryset(self):
        return Workspace.objects.filter(
            members__user=self.request.user
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
        member = workspace.members.filter(user=request.user, role=WorkspaceMember.Role.ADMIN).first()
        if not member:
            return Response(
                {'error': 'Only admins can update workspace.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)


class WorkspaceMemberListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceMemberSerializer

    def get_queryset(self):
        workspace_id = self.kwargs['workspace_id']
        workspace = get_object_or_404(
            Workspace,
            id=workspace_id,
            members__user=self.request.user
        )
        return workspace.members.select_related('user').all()


class AddWorkspaceMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, workspace_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        # Only admins can add members
        if not workspace.members.filter(user=request.user, role=WorkspaceMember.Role.ADMIN).exists():
            return Response(
                {'error': 'Only admins can add members.'},
                status=status.HTTP_403_FORBIDDEN
            )
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
            return Response({'error': 'User is already a member.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(WorkspaceMemberSerializer(member).data, status=status.HTTP_201_CREATED)


class RemoveWorkspaceMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, workspace_id, user_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        if not workspace.members.filter(user=request.user, role=WorkspaceMember.Role.ADMIN).exists():
            return Response(
                {'error': 'Only admins can remove members.'},
                status=status.HTTP_403_FORBIDDEN
            )
        member = get_object_or_404(WorkspaceMember, workspace=workspace, user_id=user_id)
        if member.user == workspace.owner:
            return Response({'error': 'Cannot remove the workspace owner.'}, status=status.HTTP_400_BAD_REQUEST)
        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UpdateMemberRoleView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, workspace_id, user_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        if not workspace.members.filter(user=request.user, role=WorkspaceMember.Role.ADMIN).exists():
            return Response({'error': 'Only admins can change roles.'}, status=status.HTTP_403_FORBIDDEN)
        member = get_object_or_404(WorkspaceMember, workspace=workspace, user_id=user_id)
        role = request.data.get('role')
        if role not in [r.value for r in WorkspaceMember.Role]:
            return Response({'error': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)
        member.role = role
        member.save()
        return Response(WorkspaceMemberSerializer(member).data)
