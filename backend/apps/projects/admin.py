from django_mongoengine import mongo_admin
from django_mongoengine.mongo_admin import DocumentAdmin

from .documents import FolderDocument, ProjectDocument, ProjectMemberDocument, SpaceDocument


@mongo_admin.register(SpaceDocument)
class SpaceDocumentAdmin(DocumentAdmin):
    list_display = ['name', 'workspaceId', 'order', 'created_at']
    list_filter = ['workspaceId']
    search_fields = ['name', 'workspaceId']


@mongo_admin.register(FolderDocument)
class FolderDocumentAdmin(DocumentAdmin):
    list_display = ['name', 'spaceId', 'workspaceId', 'order', 'created_at']
    list_filter = ['workspaceId', 'spaceId']
    search_fields = ['name', 'spaceId', 'workspaceId']


@mongo_admin.register(ProjectDocument)
class ProjectDocumentAdmin(DocumentAdmin):
    list_display = ['name', 'workspaceId', 'spaceId', 'folderId', 'ownerId', 'status', 'created_at']
    list_filter = ['status', 'workspaceId']
    search_fields = ['name', 'workspaceId', 'spaceId', 'folderId']


@mongo_admin.register(ProjectMemberDocument)
class ProjectMemberDocumentAdmin(DocumentAdmin):
    list_display = ['projectId', 'userId', 'role', 'joined_at']
    list_filter = ['role']
