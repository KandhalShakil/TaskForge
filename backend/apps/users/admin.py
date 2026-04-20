from django_mongoengine import mongo_admin
from django_mongoengine.mongo_admin import DocumentAdmin

from .documents import UserDocument


@mongo_admin.register(UserDocument)
class UserDocumentAdmin(DocumentAdmin):
    list_display = ['email', 'full_name', 'user_type', 'is_active', 'is_staff', 'date_joined']
    list_filter = ['user_type', 'is_active', 'is_staff']
    search_fields = ['email', 'full_name']
