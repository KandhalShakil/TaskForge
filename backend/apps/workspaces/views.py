import uuid

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsWorkspaceAdmin, IsWorkspaceMemberOrAdmin

from apps.users.documents import UserDocument
from .documents import WorkspaceDocument, WorkspaceMemberDocument
from .serializers import (
    WorkspaceSerializer, WorkspaceDetailSerializer, WorkspaceMemberSerializer
)


class WorkspaceListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceSerializer

    def get_serializer_class(self):
        return WorkspaceSerializer

    def get_queryset(self):
        membership_workspace_ids = [
            membership.workspaceId
            for membership in WorkspaceMemberDocument.objects(
                userId=str(self.request.user.id),
                status='accepted',
            )
        ]
        return WorkspaceDocument.objects(id__in=membership_workspace_ids)

    def perform_create(self, serializer):
        user = self.request.user
        
        # Enforce RBAC: Only Company and Admin accounts can create workspaces.
        # Employees are restricted from creating workspaces globally.
        if hasattr(user, 'user_type'):
            if user.user_type == 'employee' and not user.is_staff:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Only Company Owners or Admin accounts can create workspaces.")
            
        serializer.save(companyId=user.companyId)


class WorkspaceDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceDetailSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'pk'

    def get_queryset(self):
        membership_workspace_ids = [
            membership.workspaceId
            for membership in WorkspaceMemberDocument.objects(
                userId=str(self.request.user.id),
                status='accepted',
            )
        ]
        return WorkspaceDocument.objects(id__in=membership_workspace_ids)

    def destroy(self, request, *args, **kwargs):
        workspace = self.get_object()
        if str(workspace.ownerId) != str(request.user.id):
            return Response(
                {'error': 'Only the workspace owner can delete it.'},
                status=status.HTTP_403_FORBIDDEN
            )

        WorkspaceMemberDocument.objects(workspaceId=str(workspace.id)).delete()
        workspace.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def update(self, request, *args, **kwargs):
        workspace = self.get_object()
        if not WorkspaceMemberDocument.objects(
            workspaceId=str(workspace.id),
            userId=str(request.user.id),
            role='admin',
            status='accepted',
        ).first():
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
        return WorkspaceMemberDocument.objects(workspaceId=str(workspace_id))


class AddWorkspaceMemberView(APIView):
    permission_classes = [IsAuthenticated, IsWorkspaceAdmin]

    def post(self, request, workspace_id):
        workspace = WorkspaceDocument.objects(id=str(workspace_id)).first()
        if not workspace:
            return Response({'error': 'Workspace not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = WorkspaceMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_id = serializer.validated_data['user_id']
        user = UserDocument.objects(id=str(user_id)).first()
        if not user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Requirement 7 & 8: Only users from SAME company can be added.
        if str(user.companyId) != str(request.user.companyId):
            return Response(
                {'error': 'You can only add users from your own company.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Restricted: Only Employees can be added as workspace members.
        if user.user_type == 'owner':
            return Response(
                {'error': 'Company owners cannot be added as workspace members to other company workspaces.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        member = WorkspaceMemberDocument.objects(
            workspaceId=str(workspace.id),
            userId=str(user.id),
        ).first()

        if not member:
            member = WorkspaceMemberDocument(
                id=str(uuid.uuid4()),
                workspaceId=str(workspace.id),
                userId=str(user.id),
                role=serializer.validated_data.get('role', 'member'),
                status='pending',
            )
            member.save()
            return Response(WorkspaceMemberSerializer(member).data, status=status.HTTP_201_CREATED)

        if member.status == 'pending':
            return Response({'error': f'An invitation for {user.email} is already pending.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'error': f'{user.email} is already a member of this workspace.'}, status=status.HTTP_400_BAD_REQUEST)


class RemoveWorkspaceMemberView(APIView):
    permission_classes = [IsAuthenticated, IsWorkspaceAdmin]

    def delete(self, request, workspace_id, user_id):
        workspace = WorkspaceDocument.objects(id=str(workspace_id)).first()
        if not workspace:
            return Response({'error': 'Workspace not found.'}, status=status.HTTP_404_NOT_FOUND)

        member = WorkspaceMemberDocument.objects(
            workspaceId=str(workspace.id),
            userId=str(user_id),
        ).first()
        if not member:
            return Response({'error': 'Workspace member not found.'}, status=status.HTTP_404_NOT_FOUND)

        if str(member.userId) == str(workspace.ownerId):
            return Response({'error': 'Cannot remove the workspace owner.'}, status=status.HTTP_400_BAD_REQUEST)
        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UpdateMemberRoleView(APIView):
    permission_classes = [IsAuthenticated, IsWorkspaceAdmin]

    def patch(self, request, workspace_id, user_id):
        workspace = WorkspaceDocument.objects(id=str(workspace_id)).first()
        if not workspace:
            return Response({'error': 'Workspace not found.'}, status=status.HTTP_404_NOT_FOUND)

        member = WorkspaceMemberDocument.objects(
            workspaceId=str(workspace.id),
            userId=str(user_id),
        ).first()
        if not member:
            return Response({'error': 'Workspace member not found.'}, status=status.HTTP_404_NOT_FOUND)

        role = request.data.get('role')
        if role not in ['admin', 'member', 'viewer']:
            return Response({'error': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)
        member.role = role
        member.save()
        return Response(WorkspaceMemberSerializer(member).data)


class MyInvitationsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceMemberSerializer

    def get_queryset(self):
        return WorkspaceMemberDocument.objects(
            userId=str(self.request.user.id),
            status='pending',
        )


class RespondToInvitationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, member_id):
        action = request.data.get('action')
        member = WorkspaceMemberDocument.objects(
            id=str(member_id),
            userId=str(request.user.id),
            status='pending',
        )
        member = member.first()
        if not member:
            return Response({'error': 'Invitation not found.'}, status=status.HTTP_404_NOT_FOUND)

        if action == 'accept':
            member.status = 'accepted'
            member.save()
            return Response(WorkspaceMemberSerializer(member).data)
        elif action == 'decline':
            member.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        
        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)
