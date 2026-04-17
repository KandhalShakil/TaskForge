from decouple import config
from pymongo import MongoClient, ASCENDING


def get_mongo_client():
    uri = config('MONGO_URI', default='')
    if not uri:
        raise ValueError('MONGO_URI is not configured')
    return MongoClient(uri)


def get_mongo_db():
    client = get_mongo_client()
    db_name = config('MONGO_DB_NAME', default='takify')
    return client[db_name]


def ensure_indexes():
    db = get_mongo_db()

    # Common indexes requested for auth/task-heavy workloads.
    db.users.create_index([('email', ASCENDING)], unique=True, name='users_email_unique')
    db.tasks.create_index([('userId', ASCENDING)], name='tasks_user_id_idx')
    db.tasks.create_index([('createdAt', ASCENDING)], name='tasks_created_at_idx')
    db.chat_messages.create_index([('roomId', ASCENDING), ('createdAt', ASCENDING)], name='chat_room_created_idx')
    db.chat_messages.create_index([('workspaceId', ASCENDING), ('createdAt', ASCENDING)], name='chat_workspace_created_idx')
    db.chat_messages.create_index([('taskId', ASCENDING), ('createdAt', ASCENDING)], name='chat_task_created_idx')
    db.chat_messages.create_index([('receiverId', ASCENDING), ('createdAt', ASCENDING)], name='chat_receiver_created_idx')
    db.chat_messages.create_index([('chatType', ASCENDING), ('createdAt', ASCENDING)], name='chat_type_created_idx')
