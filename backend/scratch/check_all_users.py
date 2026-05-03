import os
import django
from mongoengine import connect
from decouple import config

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.users.documents import UserDocument

def check_users():
    users = UserDocument.objects()
    print(f"Total users: {users.count()}")
    for user in users:
        print(f"ID: {user.id}, Email: {user.email}, Is Deleted: {getattr(user, 'is_deleted', False)}")

if __name__ == "__main__":
    check_users()
