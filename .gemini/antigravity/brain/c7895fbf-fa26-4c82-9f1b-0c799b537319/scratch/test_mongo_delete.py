import os
import sys
from datetime import datetime

# Mocking the environment
import uuid
from mongoengine import connect, Document, fields

class UserDocument(Document):
    id = fields.StringField(primary_key=True)
    email = fields.EmailField()
    is_active = fields.BooleanField(default=True)
    is_deleted = fields.BooleanField(default=False)
    meta = {'collection': 'test_users'}

def test():
    connect('test_db', host='mongodb://localhost:27017/test_db')
    UserDocument.objects.delete()

    user_id = str(uuid.uuid4())
    user = UserDocument(id=user_id, email='test@example.com', is_active=True, is_deleted=False)
    user.save()

    print(f"Created user: {user.id}, is_active={user.is_active}, is_deleted={user.is_deleted}")

    # Simulate delete
    fetched_user = UserDocument.objects(id=user_id).first()
    fetched_user.is_deleted = True
    fetched_user.is_active = False
    fetched_user.save()

    print(f"Deleted user: {fetched_user.id}, is_active={fetched_user.is_active}, is_deleted={fetched_user.is_deleted}")

    # Re-fetch
    refetched = UserDocument.objects(id=user_id).first()
    print(f"Refetched user: {refetched.id}, is_active={refetched.is_active}, is_deleted={refetched.is_deleted}")

    if refetched.is_deleted and not refetched.is_active:
        print("Success: User correctly marked as deleted and inactive")
    else:
        print("Failure: User state not persisted correctly")

if __name__ == '__main__':
    try:
        test()
    except Exception as e:
        print(f"Error: {e}")
