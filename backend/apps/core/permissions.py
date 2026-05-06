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
    Allows read-access to all members.
    Allows write-access ONLY to Admins/Members.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        workspace_id = view.kwargs.get('workspace_id') or request.data.get('workspace')
        
        if not workspace_id:
            # Fallback for list views where workspace is filtered in queryset
            return True

        membership = WorkspaceMemberDocument.objects(
            workspaceId=str(workspace_id),
            userId=str(request.user.id),
            status='accepted',
        ).first()

        if not membership:
            return False
            
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Structural creation (Spaces, Projects, etc) should be Admin only in some views,
        # but this class is the general "Member" access. 
        # We use IsWorkspaceAdmin for structural enforcement.
        return membership.role in ['admin', 'member']

    def has_object_permission(self, request, view, obj):
        workspace_id = getattr(obj, 'workspaceId', None) or getattr(obj, 'workspace_id', None)
        if not workspace_id:
            return True

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


class IsTaskOwnerOrAdmin(permissions.BasePermission):
    """
    Allows mutation only to:
    1. Workspace Admins
    2. Task Creator
    3. Task Assignee
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        # 1. Check Workspace Admin status
        workspace_id = getattr(obj, 'workspaceId', None)
        is_admin = WorkspaceMemberDocument.objects(
            workspaceId=str(workspace_id),
            userId=str(request.user.id),
            role='admin',
            status='accepted'
        ).first() is not None

        if is_admin:
            return True

        # 2. Check Ownership/Assignment
        user_id = str(request.user.id)
        is_creator = getattr(obj, 'createdById', None) == user_id
        is_assignee = getattr(obj, 'assigneeId', None) == user_id

        return is_creator or is_assignee


class IsCompanyOwner(permissions.BasePermission):
    """
    Allows access only to company owners.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.user_type == 'owner'
        )


class IsCompanyAdminOrOwner(permissions.BasePermission):
    """
    Allows access to owners and admins.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.user_type in ['owner', 'admin']
        )


class CompanyTenantMixin:
    """
    Mixin for views to automatically filter the queryset by companyId.
    Usage:
        class MyView(CompanyTenantMixin, generics.ListAPIView):
            document_class = MyDocument
    """
    def get_queryset(self):
        if not self.request.user or not self.request.user.is_authenticated:
            return self.document_class.objects.none()
            
        company_id = getattr(self.request.user, 'companyId', None)
        if not company_id:
            return self.document_class.objects.none()
            
        return self.document_class.objects(companyId=str(company_id))
