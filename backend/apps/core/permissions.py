from rest_framework import permissions
from apps.workspaces.models import WorkspaceMember

class IsWorkspaceAdmin(permissions.BasePermission):
    """
    Allows access only to workspace admins.
    Supports both has_permission (request/view) and has_object_permission (model instance).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # If it's an object-level detail view, we let has_object_permission handle it
        if 'pk' in view.kwargs and request.method not in permissions.SAFE_METHODS:
            return True

        workspace_id = view.kwargs.get('workspace_id') or request.data.get('workspace')
        
        if not workspace_id:
            return True # Fallback to queryset filtering in the view

        return WorkspaceMember.objects.filter(
            workspace_id=workspace_id,
            user=request.user,
            role=WorkspaceMember.Role.ADMIN,
            status=WorkspaceMember.Status.ACCEPTED
        ).exists()

    def has_object_permission(self, request, view, obj):
        # Traverse relationships to find workspace
        workspace = getattr(obj, 'workspace', None)
        if not workspace and hasattr(obj, 'task'):
            workspace = obj.task.workspace
        if not workspace and hasattr(obj, 'project'):
            workspace = obj.project.workspace
        if not workspace:
            workspace = obj

        return WorkspaceMember.objects.filter(
            workspace=workspace,
            user=request.user,
            role=WorkspaceMember.Role.ADMIN,
            status=WorkspaceMember.Status.ACCEPTED
        ).exists()


class IsWorkspaceMemberOrAdmin(permissions.BasePermission):
    """
    Allows access to Admins and Members, but NOT Viewers for write operations.
    Read-only access is restricted to members/admins of the workspace.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        workspace_id = view.kwargs.get('workspace_id') or request.data.get('workspace')
        
        # Auto-detect from context if possible
        if not workspace_id:
            project_id = view.kwargs.get('project_id') or request.data.get('project')
            if project_id:
                from apps.projects.models import Project
                try:
                    project = Project.objects.get(id=project_id)
                    workspace_id = project.workspace_id
                except Project.DoesNotExist:
                    pass
                    
            task_id = view.kwargs.get('task_id') or request.data.get('task')
            if task_id:
                from apps.tasks.models import Task
                try:
                    task = Task.objects.get(id=task_id)
                    workspace_id = task.workspace_id
                except Task.DoesNotExist:
                    pass

        if not workspace_id:
            return True # Fallback to queryset filtering

        membership = WorkspaceMember.objects.filter(
            workspace_id=workspace_id,
            user=request.user,
            status=WorkspaceMember.Status.ACCEPTED
        ).first()

        if not membership:
            return False
            
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Standard members can create/edit, Viewers cannot.
        return membership.role in [WorkspaceMember.Role.ADMIN, WorkspaceMember.Role.MEMBER]

    def has_object_permission(self, request, view, obj):
        # Traverse relationships
        workspace = getattr(obj, 'workspace', None)
        if not workspace and hasattr(obj, 'task'):
            workspace = obj.task.workspace
        if not workspace and hasattr(obj, 'project'):
            workspace = obj.project.workspace
        if not workspace:
            workspace = obj

        membership = WorkspaceMember.objects.filter(
            workspace=workspace,
            user=request.user,
            status=WorkspaceMember.Status.ACCEPTED
        ).first()

        if not membership:
            return False
            
        if request.method in permissions.SAFE_METHODS:
            return True
            
        return membership.role in [WorkspaceMember.Role.ADMIN, WorkspaceMember.Role.MEMBER]
