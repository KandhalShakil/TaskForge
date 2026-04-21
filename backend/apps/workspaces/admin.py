from django_mongoengine import mongo_admin
from django_mongoengine.mongo_admin import DocumentAdmin

from .documents import WorkspaceDocument, WorkspaceMemberDocument


@mongo_admin.register(WorkspaceDocument)
class WorkspaceDocumentAdmin(DocumentAdmin):
    list_display = ['name', 'ownerId', 'created_at']
    search_fields = ['name', 'ownerId']
    list_filter = ['created_at']


@mongo_admin.register(WorkspaceMemberDocument)
class WorkspaceMemberDocumentAdmin(DocumentAdmin):
    list_display = ['workspaceId', 'userId', 'role', 'status', 'joined_at']
    list_filter = ['role', 'status']
    search_fields = ['workspaceId', 'userId']
