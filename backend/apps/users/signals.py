from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.core.mongo_sync import delete_document, model_to_document, upsert_document
from .models import User


@receiver([post_save, post_delete], sender=User)
def sync_user_to_mongo(sender, instance, **kwargs):
    if kwargs.get('signal') == post_delete:
        delete_document('users', instance.id)
        return

    upsert_document('users', model_to_document(instance, {
        '_id': lambda obj: str(obj.id),
        'email': lambda obj: obj.email,
        'full_name': lambda obj: obj.full_name,
        'avatar': lambda obj: obj.avatar.url if obj.avatar else None,
        'user_type': lambda obj: obj.user_type,
        'is_active': lambda obj: obj.is_active,
        'is_staff': lambda obj: obj.is_staff,
        'is_superuser': lambda obj: obj.is_superuser,
        'date_joined': lambda obj: obj.date_joined,
        'updated_at': lambda obj: obj.updated_at,
    }))