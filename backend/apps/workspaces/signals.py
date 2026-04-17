from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.core.mongo_sync import delete_document, model_to_document, upsert_document
from .models import Workspace, WorkspaceMember


@receiver([post_save, post_delete], sender=Workspace)
def sync_workspace_to_mongo(sender, instance, **kwargs):
    if kwargs.get('signal') == post_delete:
        delete_document('workspaces', instance.id)
        return

    upsert_document('workspaces', model_to_document(instance, {
        '_id': lambda obj: str(obj.id),
        'name': lambda obj: obj.name,
        'description': lambda obj: obj.description,
        'icon': lambda obj: obj.icon,
        'color': lambda obj: obj.color,
        'ownerId': lambda obj: str(obj.owner_id) if obj.owner_id else None,
        'created_at': lambda obj: obj.created_at,
        'updated_at': lambda obj: obj.updated_at,
    }))


@receiver([post_save, post_delete], sender=WorkspaceMember)
def sync_workspace_member_to_mongo(sender, instance, **kwargs):
    if kwargs.get('signal') == post_delete:
        delete_document('workspace_members', instance.id)
        return

    upsert_document('workspace_members', model_to_document(instance, {
        '_id': lambda obj: str(obj.id),
        'workspaceId': lambda obj: str(obj.workspace_id),
        'userId': lambda obj: str(obj.user_id),
        'role': lambda obj: obj.role,
        'status': lambda obj: obj.status,
        'joined_at': lambda obj: obj.joined_at,
    }))