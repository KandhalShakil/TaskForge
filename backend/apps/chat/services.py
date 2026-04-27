from __future__ import annotations

from datetime import datetime

from bson import ObjectId
from django.utils import timezone

from apps.core.mongo import get_mongo_db
from apps.tasks.documents import TaskDocument
from apps.users.documents import UserDocument
from apps.workspaces.documents import WorkspaceDocument, WorkspaceMemberDocument


def _iso(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    if hasattr(value, 'isoformat'):
        return value.isoformat()
    return value


def _member_exists(*, workspace_id, user_id):
    return WorkspaceMemberDocument.objects(
        workspaceId=str(workspace_id),
        userId=str(user_id),
        status='accepted',
    ).first() is not None


def _user_summary(user_id):
    if not user_id:
        return None
    user = UserDocument.objects(id=str(user_id)).first()
    if not user:
        return None
    full_name = user.full_name or ''
    parts = full_name.split()
    initials = ''.join(part[0].upper() for part in parts[:2]) if parts else ''
    return {
        'id': str(user.id),
        'full_name': full_name,
        'email': user.email,
        'avatar': user.avatar,
        'initials': initials,
    }


def build_workspace_room(workspace_id):
    return f'workspace_{workspace_id}'


def build_task_room(task_id):
    return f'task_{task_id}'


def build_direct_room(user_a_id, user_b_id):
    user_ids = sorted([str(user_a_id), str(user_b_id)])
    return f'dm_{user_ids[0]}_{user_ids[1]}'


def parse_room(room):
    if room.startswith('workspace_'):
        workspace_id = room.removeprefix('workspace_')
        return {
            'chatType': 'workspace',
            'workspaceId': workspace_id,
            'taskId': None,
            'receiverId': None,
            'roomId': room,
        }

    if room.startswith('task_'):
        task_id = room.removeprefix('task_')
        task = TaskDocument.objects(id=str(task_id)).first()
        return {
            'chatType': 'task',
            'workspaceId': str(task.workspaceId) if task else None,
            'taskId': task_id,
            'receiverId': None,
            'roomId': room,
        }

    if room.startswith('dm_'):
        rest = room.removeprefix('dm_')
        user_a, user_b = rest.split('_', 1)
        return {
            'chatType': 'direct',
            'workspaceId': None,
            'taskId': None,
            'receiverId': None,
            'participants': [user_a, user_b],
            'roomId': room,
        }

    raise ValueError('Invalid room format')


def validate_room_access(user, room, workspace_id=None):
    context = parse_room(room)

    if context['chatType'] == 'workspace':
        workspace = WorkspaceDocument.objects(id=str(context['workspaceId'])).first()
        if not workspace:
            return None
        if not _member_exists(workspace_id=workspace.id, user_id=user.id):
            return None
        context['workspace'] = workspace
        return context

    if context['chatType'] == 'task':
        task = TaskDocument.objects(id=str(context['taskId'])).first()
        if not task:
            return None
        if not _member_exists(workspace_id=task.workspaceId, user_id=user.id):
            return None
        context['task'] = task
        context['workspaceId'] = str(task.workspaceId)
        return context

    if context['chatType'] == 'direct':
        participant_ids = context.get('participants', [])
        if str(user.id) not in participant_ids:
            return None
        context['otherUserId'] = participant_ids[1] if participant_ids[0] == str(user.id) else participant_ids[0]
        if workspace_id:
            workspace = WorkspaceDocument.objects(id=str(workspace_id)).first()
            if workspace and _member_exists(workspace_id=workspace.id, user_id=user.id):
                context['workspaceId'] = str(workspace.id)
                context['workspace'] = workspace
        return context

    return None


def get_message_collection():
    return get_mongo_db()['chat_messages']


def serialize_message(document):
    if not document:
        return None

    sender = _user_summary(document.get('senderId'))
    receiver = _user_summary(document.get('receiverId'))
    attachment = document.get('attachment') or {}

    return {
        'id': str(document.get('_id')),
        'roomId': document.get('roomId'),
        'chatType': document.get('chatType'),
        'workspaceId': document.get('workspaceId'),
        'taskId': document.get('taskId'),
        'receiverId': document.get('receiverId'),
        'senderId': document.get('senderId'),
        'sender': sender,
        'receiver': receiver,
        'message': document.get('message', ''),
        'clientMessageId': document.get('clientMessageId'),
        'attachmentUrl': attachment.get('url'),
        'attachmentName': attachment.get('name'),
        'attachmentType': attachment.get('type'),
        'attachmentSize': attachment.get('size'),
        'createdAt': _iso(document.get('createdAt')),
        'updatedAt': _iso(document.get('updatedAt') or document.get('createdAt')),
        'editedAt': _iso(document.get('editedAt')),
        'deletedAt': _iso(document.get('deletedAt')),
        'readBy': [str(uid) for uid in document.get('readBy', [])],
        'isEdited': document.get('editedAt') is not None,
        'isDeleted': document.get('deletedAt') is not None,
    }


def store_message(*, room, chat_type, sender_id, message, workspace_id=None, task_id=None, receiver_id=None, attachment=None, client_message_id=None):
    collection = get_message_collection()
    now = timezone.now()
    document = {
        '_id': ObjectId(),
        'roomId': room,
        'chatType': chat_type,
        'workspaceId': workspace_id,
        'taskId': task_id,
        'receiverId': receiver_id,
        'senderId': str(sender_id),
        'message': message,
        'attachment': attachment,
        'clientMessageId': client_message_id,
        'createdAt': now,
        'updatedAt': now,
        'readBy': [str(sender_id)],
    }
    collection.insert_one(document)
    return serialize_message(document)


def list_messages(*, room, limit=30, before=None, user_id=None):
    collection = get_message_collection()
    query = {'roomId': room}
    if before:
        query['createdAt'] = {'$lt': before}

    cursor = collection.find(query).sort('createdAt', -1).limit(limit)
    documents = list(cursor)
    messages = [serialize_message(doc) for doc in documents]
    has_more = collection.count_documents(query) > len(documents)
    next_cursor = documents[-1]['createdAt'].isoformat() if documents else None

    return {'messages': messages, 'hasMore': has_more, 'nextCursor': next_cursor}


def mark_messages_read(*, room, user_id):
    collection = get_message_collection()
    collection.update_many(
        {'roomId': room, 'senderId': {'$ne': str(user_id)}},
        {'$addToSet': {'readBy': str(user_id)}, '$set': {'updatedAt': timezone.now()}},
    )


def edit_message(*, message_id, user_id, message=None, attachment=None):
    collection = get_message_collection()
    document = collection.find_one({'_id': ObjectId(message_id)})
    if not document or document.get('senderId') != str(user_id):
        return None

    updates = {'updatedAt': timezone.now(), 'editedAt': timezone.now()}
    if message is not None:
        updates['message'] = message
    if attachment is not None:
        updates['attachment'] = attachment

    collection.update_one({'_id': document['_id']}, {'$set': updates})
    document.update(updates)
    return serialize_message(document)


def delete_message(*, message_id, user_id):
    collection = get_message_collection()
    document = collection.find_one({'_id': ObjectId(message_id)})
    if not document or document.get('senderId') != str(user_id):
        return None

    updates = {'message': '', 'attachment': None, 'deletedAt': timezone.now(), 'updatedAt': timezone.now()}
    collection.update_one({'_id': document['_id']}, {'$set': updates})
    document.update(updates)
    return serialize_message(document)


def get_workspace_chat_context(*, workspace_id, task_id=None, user=None, direct_user_id=None):
    if task_id:
        task = TaskDocument.objects(id=str(task_id)).first()
        if not task or not _member_exists(workspace_id=task.workspaceId, user_id=user.id):
            return None
        workspace = WorkspaceDocument.objects(id=str(task.workspaceId)).first()
        return {
            'roomId': build_task_room(task.id),
            'chatType': 'task',
            'workspaceId': str(task.workspaceId),
            'taskId': str(task.id),
            'title': task.title,
            'subtitle': workspace.name if workspace else 'Task chat',
            'participants': [],
        }

    if direct_user_id:
        other_user = UserDocument.objects(id=str(direct_user_id)).first()
        if not other_user:
            return None
        workspace = WorkspaceDocument.objects(id=str(workspace_id)).first() if workspace_id else None
        if workspace and not _member_exists(workspace_id=workspace.id, user_id=user.id):
            return None
        return {
            'roomId': build_direct_room(user.id, other_user.id),
            'chatType': 'direct',
            'workspaceId': str(workspace.id) if workspace else None,
            'taskId': None,
            'receiverId': str(other_user.id),
            'title': other_user.full_name,
            'subtitle': 'Direct message',
            'participants': [_user_summary(user.id), _user_summary(other_user.id)],
        }

    workspace = WorkspaceDocument.objects(id=str(workspace_id)).first()
    if not workspace or not _member_exists(workspace_id=workspace.id, user_id=user.id):
        return None
    return {
        'roomId': build_workspace_room(workspace.id),
        'chatType': 'workspace',
        'workspaceId': str(workspace.id),
        'taskId': None,
        'title': workspace.name,
        'subtitle': 'Workspace chat',
        'participants': [],
    }


def list_threads_for_workspace(*, workspace_id, user, task_id=None):
    workspace = WorkspaceDocument.objects(id=str(workspace_id)).first()
    if not workspace or not _member_exists(workspace_id=workspace.id, user_id=user.id):
        return None

    collection = get_message_collection()
    threads = []

    def summarize_room(room_name, chat_type, title, subtitle, workspace_value=None, task_value=None, receiver_value=None):
        query = {'roomId': room_name}
        latest = collection.find(query).sort('createdAt', -1).limit(1)
        latest_doc = next(iter(latest), None)
        last_message = serialize_message(latest_doc) if latest_doc else None
        unread_count = collection.count_documents(
            {
                'roomId': room_name,
                'senderId': {'$ne': str(user.id)},
                'readBy': {'$ne': str(user.id)},
                'deletedAt': {'$exists': False},
            }
        )
        return {
            'roomId': room_name,
            'chatType': chat_type,
            'workspaceId': workspace_value,
            'taskId': task_value,
            'receiverId': receiver_value,
            'title': title,
            'subtitle': subtitle,
            'lastMessage': last_message['message'] if last_message else '',
            'lastMessageAt': last_message['createdAt'] if last_message else None,
            'unreadCount': unread_count,
        }

    threads.append(
        summarize_room(
            build_workspace_room(workspace.id),
            'workspace',
            workspace.name,
            'Workspace chat',
            workspace_value=str(workspace.id),
        )
    )

    if task_id:
        task = TaskDocument.objects(id=str(task_id), workspaceId=str(workspace.id)).first()
        if task:
            threads.append(
                summarize_room(
                    build_task_room(task.id),
                    'task',
                    task.title,
                    workspace.name,
                    workspace_value=str(workspace.id),
                    task_value=str(task.id),
                )
            )

    member_ids = [
        str(member.userId)
        for member in WorkspaceMemberDocument.objects(workspaceId=str(workspace.id), status='accepted')
        if str(member.userId) != str(user.id)
    ]

    direct_query = {
        'chatType': 'direct',
        'workspaceId': str(workspace.id),
        '$or': [
            {'senderId': str(user.id), 'receiverId': {'$in': member_ids}},
            {'receiverId': str(user.id), 'senderId': {'$in': member_ids}},
        ],
    }

    pipeline = [
        {'$match': direct_query},
        {'$sort': {'createdAt': -1}},
        {'$group': {'_id': '$roomId', 'latest': {'$first': '$$ROOT'}}},
        {'$sort': {'latest.createdAt': -1}},
    ]

    for item in collection.aggregate(pipeline):
        latest_doc = item['latest']
        other_user_id = latest_doc['receiverId'] if latest_doc['senderId'] == str(user.id) else latest_doc['senderId']
        other_user = _user_summary(other_user_id)
        if not other_user:
            continue
        unread_count = collection.count_documents(
            {
                'roomId': latest_doc['roomId'],
                'senderId': {'$ne': str(user.id)},
                'readBy': {'$ne': str(user.id)},
                'deletedAt': {'$exists': False},
            }
        )
        threads.append(
            {
                'roomId': latest_doc['roomId'],
                'chatType': 'direct',
                'workspaceId': str(workspace.id),
                'taskId': None,
                'receiverId': other_user_id,
                'title': other_user['full_name'],
                'subtitle': 'Direct message',
                'lastMessage': latest_doc.get('message', '') or latest_doc.get('attachment', {}).get('name', ''),
                'lastMessageAt': _iso(latest_doc.get('createdAt')),
                'unreadCount': unread_count,
                'peer': other_user,
            }
        )

    members_payload = []
    for member in WorkspaceMemberDocument.objects(workspaceId=str(workspace.id), status='accepted'):
        user_doc = UserDocument.objects(id=str(member.userId)).first()
        if not user_doc:
            continue
        members_payload.append(
            {
                'id': str(user_doc.id),
                'full_name': user_doc.full_name,
                'email': user_doc.email,
                'avatar': user_doc.avatar,
                'initials': ''.join([p[0].upper() for p in (user_doc.full_name or '').split()[:2]]),
                'role': member.role,
            }
        )

    return {
        'workspace': {
            'id': str(workspace.id),
            'name': workspace.name,
            'icon': workspace.icon,
            'color': workspace.color,
        },
        'threads': threads,
        'members': members_payload,
    }
