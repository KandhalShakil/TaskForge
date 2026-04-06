from rest_framework.permissions import BasePermission, SAFE_METHODS
from apps.workspaces.models import WorkspaceMember
from apps.projects.models import ProjectMember


class IsWorkspaceMember(BasePermission):
    """Allow access only to members of the workspace."""

    def has_object_permission(self, request, view, obj):
        workspace = getattr(obj, 'workspace', obj)
        return WorkspaceMember.objects.filter(
            workspace=workspace,
            user=request.user
        ).exists()


class IsWorkspaceAdmin(BasePermission):
    """Allow access only to workspace admins."""

    def has_object_permission(self, request, view, obj):
        workspace = getattr(obj, 'workspace', obj)
        return WorkspaceMember.objects.filter(
            workspace=workspace,
            user=request.user,
            role=WorkspaceMember.Role.ADMIN
        ).exists()


class IsWorkspaceMemberOrAdmin(BasePermission):
    """Read for members, write for admins."""

    def has_object_permission(self, request, view, obj):
        workspace = getattr(obj, 'workspace', obj)
        if request.method in SAFE_METHODS:
            return WorkspaceMember.objects.filter(
                workspace=workspace,
                user=request.user
            ).exists()
        return WorkspaceMember.objects.filter(
            workspace=workspace,
            user=request.user,
            role=WorkspaceMember.Role.ADMIN
        ).exists()


class IsProjectMember(BasePermission):
    """Allow access to project members."""

    def has_object_permission(self, request, view, obj):
        project = getattr(obj, 'project', obj)
        return ProjectMember.objects.filter(
            project=project,
            user=request.user
        ).exists() or WorkspaceMember.objects.filter(
            workspace=project.workspace,
            user=request.user
        ).exists()
