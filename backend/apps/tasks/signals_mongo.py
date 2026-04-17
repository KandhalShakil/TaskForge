from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.core.mongo_sync import delete_document, model_to_document, upsert_document
from .models import Category, Comment, SubTask, Task


@receiver([post_save, post_delete], sender=Category)
def sync_category_to_mongo(sender, instance, **kwargs):
    if kwargs.get('signal') == post_delete:
        delete_document('categories', instance.id)
        return

    upsert_document('categories', model_to_document(instance, {
        '_id': lambda obj: str(obj.id),
        'workspaceId': lambda obj: str(obj.workspace_id),
        'name': lambda obj: obj.name,
        'color': lambda obj: obj.color,
        'created_at': lambda obj: obj.created_at,
    }))


@receiver([post_save, post_delete], sender=Task)
def sync_task_to_mongo(sender, instance, **kwargs):
    if kwargs.get('signal') == post_delete:
        delete_document('tasks', instance.id)
        return

    upsert_document('tasks', model_to_document(instance, {
        '_id': lambda obj: str(obj.id),
        'workspaceId': lambda obj: str(obj.workspace_id),
        'projectId': lambda obj: str(obj.project_id) if obj.project_id else None,
        'title': lambda obj: obj.title,
        'description': lambda obj: obj.description,
        'status': lambda obj: obj.status,
        'priority': lambda obj: obj.priority,
        'categoryId': lambda obj: str(obj.category_id) if obj.category_id else None,
        'assigneeId': lambda obj: str(obj.assignee_id) if obj.assignee_id else None,
        'createdById': lambda obj: str(obj.created_by_id) if obj.created_by_id else None,
        'due_date': lambda obj: obj.due_date,
        'start_date': lambda obj: obj.start_date,
        'estimated_hours': lambda obj: obj.estimated_hours,
        'order': lambda obj: obj.order,
        'created_at': lambda obj: obj.created_at,
        'updated_at': lambda obj: obj.updated_at,
    }))


@receiver([post_save, post_delete], sender=Comment)
def sync_comment_to_mongo(sender, instance, **kwargs):
    if kwargs.get('signal') == post_delete:
        delete_document('task_comments', instance.id)
        return

    upsert_document('task_comments', model_to_document(instance, {
        '_id': lambda obj: str(obj.id),
        'taskId': lambda obj: str(obj.task_id),
        'authorId': lambda obj: str(obj.author_id),
        'content': lambda obj: obj.content,
        'created_at': lambda obj: obj.created_at,
        'updated_at': lambda obj: obj.updated_at,
    }))


@receiver([post_save, post_delete], sender=SubTask)
def sync_subtask_to_mongo(sender, instance, **kwargs):
    if kwargs.get('signal') == post_delete:
        delete_document('subtasks', instance.id)
        return

    upsert_document('subtasks', model_to_document(instance, {
        '_id': lambda obj: str(obj.id),
        'taskId': lambda obj: str(obj.task_id),
        'parentId': lambda obj: str(obj.parent_id) if obj.parent_id else None,
        'title': lambda obj: obj.title,
        'description': lambda obj: obj.description,
        'status': lambda obj: obj.status,
        'priority': lambda obj: obj.priority,
        'categoryId': lambda obj: str(obj.category_id) if obj.category_id else None,
        'assigneeId': lambda obj: str(obj.assignee_id) if obj.assignee_id else None,
        'start_date': lambda obj: obj.start_date,
        'due_date': lambda obj: obj.due_date,
        'estimated_hours': lambda obj: obj.estimated_hours,
        'is_completed': lambda obj: obj.is_completed,
        'order': lambda obj: obj.order,
        'created_at': lambda obj: obj.created_at,
        'updated_at': lambda obj: obj.updated_at,
    }))