from django_mongoengine import mongo_admin
from django_mongoengine.mongo_admin import DocumentAdmin

from .documents import CategoryDocument, CommentDocument, SubTaskDocument, TaskDocument


@mongo_admin.register(TaskDocument)
class TaskDocumentAdmin(DocumentAdmin):
    list_display = ['title', 'projectId', 'status', 'priority', 'assigneeId', 'due_date', 'created_at']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['title', 'description']


@mongo_admin.register(CategoryDocument)
class CategoryDocumentAdmin(DocumentAdmin):
    list_display = ['name', 'workspaceId', 'color']
    search_fields = ['name']


@mongo_admin.register(CommentDocument)
class CommentDocumentAdmin(DocumentAdmin):
    list_display = ['taskId', 'authorId', 'created_at']
    search_fields = ['content', 'authorId']


@mongo_admin.register(SubTaskDocument)
class SubTaskDocumentAdmin(DocumentAdmin):
    list_display = ['title', 'taskId', 'is_completed', 'order', 'created_at']
    list_filter = ['is_completed', 'created_at']
    search_fields = ['title', 'taskId']