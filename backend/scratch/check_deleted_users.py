import os
import django
from decouple import config

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.users.documents import UserDocument

def check_users():
    deleted_users = UserDocument.objects(is_deleted=True)
    print(f"Total deleted users: {deleted_users.count()}")
    for user in deleted_users:
        print(f"ID: {user.id}, Email: {user.email}, Deleted At: {user.deleted_at}")

if __name__ == "__main__":
    check_users()
