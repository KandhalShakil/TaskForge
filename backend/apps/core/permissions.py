from rest_framework import permissions

from apps.projects.documents import ProjectDocument
from apps.tasks.documents import TaskDocument
from apps.workspaces.documents import WorkspaceMemberDocument

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

        return WorkspaceMemberDocument.objects(
            workspaceId=str(workspace_id),
            userId=str(request.user.id),
            role='admin',
            status='accepted',
        ).first() is not None

    def has_object_permission(self, request, view, obj):
        # Traverse relationships to find workspace
        workspace_id = getattr(obj, 'workspaceId', None)
        if workspace_id is None:
            workspace_id = getattr(obj, 'workspace_id', None)
        if workspace_id is None and hasattr(obj, 'taskId'):
            task = TaskDocument.objects(id=str(obj.taskId)).first()
            workspace_id = task.workspaceId if task else None
        if workspace_id is None and hasattr(obj, 'projectId'):
            project = ProjectDocument.objects(id=str(obj.projectId)).first()
            workspace_id = project.workspaceId if project else None
        if workspace_id is None:
            workspace_id = getattr(obj, 'id', None)

        return WorkspaceMemberDocument.objects(
            workspaceId=str(workspace_id),
            userId=str(request.user.id),
            role='admin',
            status='accepted',
        ).first() is not None


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
                project = ProjectDocument.objects(id=str(project_id)).first()
                workspace_id = project.workspaceId if project else None
                    
            task_id = view.kwargs.get('task_id') or request.data.get('task')
            if task_id:
                task = TaskDocument.objects(id=str(task_id)).first()
                workspace_id = task.workspaceId if task else workspace_id

        if not workspace_id:
            return True # Fallback to queryset filtering

        membership = WorkspaceMemberDocument.objects(
            workspaceId=str(workspace_id),
            userId=str(request.user.id),
            status='accepted',
        ).first()

        if not membership:
            return False
            
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Standard members can create/edit, Viewers cannot.
        return membership.role in ['admin', 'member']

    def has_object_permission(self, request, view, obj):
        # Traverse relationships
        workspace_id = getattr(obj, 'workspaceId', None)
        if workspace_id is None:
            workspace_id = getattr(obj, 'workspace_id', None)
        if workspace_id is None and hasattr(obj, 'taskId'):
            task = TaskDocument.objects(id=str(obj.taskId)).first()
            workspace_id = task.workspaceId if task else None
        if workspace_id is None and hasattr(obj, 'projectId'):
            project = ProjectDocument.objects(id=str(obj.projectId)).first()
            workspace_id = project.workspaceId if project else None
        if workspace_id is None:
            workspace_id = getattr(obj, 'id', None)

        membership = WorkspaceMemberDocument.objects(
            workspaceId=str(workspace_id),
            userId=str(request.user.id),
            status='accepted',
        ).first()

        if not membership:
            return False
            
        if request.method in permissions.SAFE_METHODS:
            return True
            
        return membership.role in ['admin', 'member']
