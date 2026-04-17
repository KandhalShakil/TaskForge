from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.core.mongo_sync import delete_document, model_to_document, upsert_document
from .models import Space, Folder, Project, ProjectMember


@receiver([post_save, post_delete], sender=Space)
def sync_space_to_mongo(sender, instance, **kwargs):
    if kwargs.get('signal') == post_delete:
        delete_document('spaces', instance.id)
        return

    upsert_document('spaces', model_to_document(instance, {
        '_id': lambda obj: str(obj.id),
        'workspaceId': lambda obj: str(obj.workspace_id),
        'name': lambda obj: obj.name,
        'description': lambda obj: obj.description,
        'icon': lambda obj: obj.icon,
        'color': lambda obj: obj.color,
        'order': lambda obj: obj.order,
        'createdById': lambda obj: str(obj.created_by_id) if obj.created_by_id else None,
        'created_at': lambda obj: obj.created_at,
        'updated_at': lambda obj: obj.updated_at,
    }))


@receiver([post_save, post_delete], sender=Folder)
def sync_folder_to_mongo(sender, instance, **kwargs):
    if kwargs.get('signal') == post_delete:
        delete_document('folders', instance.id)
        return

    upsert_document('folders', model_to_document(instance, {
        '_id': lambda obj: str(obj.id),
        'workspaceId': lambda obj: str(obj.workspace_id),
        'spaceId': lambda obj: str(obj.space_id),
        'name': lambda obj: obj.name,
        'description': lambda obj: obj.description,
        'icon': lambda obj: obj.icon,
        'color': lambda obj: obj.color,
        'order': lambda obj: obj.order,
        'createdById': lambda obj: str(obj.created_by_id) if obj.created_by_id else None,
        'created_at': lambda obj: obj.created_at,
        'updated_at': lambda obj: obj.updated_at,
    }))


@receiver([post_save, post_delete], sender=Project)
def sync_project_to_mongo(sender, instance, **kwargs):
    if kwargs.get('signal') == post_delete:
        delete_document('projects', instance.id)
        return

    upsert_document('projects', model_to_document(instance, {
        '_id': lambda obj: str(obj.id),
        'workspaceId': lambda obj: str(obj.workspace_id),
        'spaceId': lambda obj: str(obj.space_id) if obj.space_id else None,
        'folderId': lambda obj: str(obj.folder_id) if obj.folder_id else None,
        'name': lambda obj: obj.name,
        'description': lambda obj: obj.description,
        'icon': lambda obj: obj.icon,
        'color': lambda obj: obj.color,
        'status': lambda obj: obj.status,
        'ownerId': lambda obj: str(obj.owner_id) if obj.owner_id else None,
        'start_date': lambda obj: obj.start_date,
        'end_date': lambda obj: obj.end_date,
        'order': lambda obj: obj.order,
        'created_at': lambda obj: obj.created_at,
        'updated_at': lambda obj: obj.updated_at,
    }))


@receiver([post_save, post_delete], sender=ProjectMember)
def sync_project_member_to_mongo(sender, instance, **kwargs):
    if kwargs.get('signal') == post_delete:
        delete_document('project_members', instance.id)
        return

    upsert_document('project_members', model_to_document(instance, {
        '_id': lambda obj: str(obj.id),
        'projectId': lambda obj: str(obj.project_id),
        'userId': lambda obj: str(obj.user_id),
        'role': lambda obj: obj.role,
        'joined_at': lambda obj: obj.joined_at,
    }))