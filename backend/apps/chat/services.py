from __future__ import annotations

from datetime import datetime

from bson import ObjectId
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone

from apps.core.mongo import get_mongo_db
from apps.projects.models import Project
from apps.tasks.models import Task
from apps.workspaces.models import Workspace, WorkspaceMember


User = get_user_model()


def _iso(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    if hasattr(value, 'isoformat'):
        return value.isoformat()
    return value


def _user_summary(user_id):
    if not user_id:
        return None
    user = User.objects.filter(id=user_id).only('id', 'full_name', 'email', 'avatar').first()
    if not user:
        return None
    return {
        'id': str(user.id),
        'full_name': user.full_name,
        'email': user.email,
        'avatar': user.avatar.url if user.avatar else None,
        'initials': user.initials,
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
        task = Task.objects.select_related('workspace').filter(id=task_id).first()
        return {
            'chatType': 'task',
            'workspaceId': str(task.workspace_id) if task else None,
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
        workspace = Workspace.objects.filter(id=context['workspaceId']).first()
        if not workspace:
            return None
        if not WorkspaceMember.objects.filter(
            workspace=workspace,
            user=user,
            status=WorkspaceMember.Status.ACCEPTED,
        ).exists():
            return None
        context['workspace'] = workspace
        return context

    if context['chatType'] == 'task':
        task = Task.objects.select_related('workspace', 'project').filter(id=context['taskId']).first()
        if not task:
            return None
        if not WorkspaceMember.objects.filter(
            workspace=task.workspace,
            user=user,
            status=WorkspaceMember.Status.ACCEPTED,
        ).exists():
            return None
        context['task'] = task
        context['workspaceId'] = str(task.workspace_id)
        return context

    if context['chatType'] == 'direct':
        participant_ids = context.get('participants', [])
        if str(user.id) not in participant_ids:
            return None
        context['otherUserId'] = participant_ids[1] if participant_ids[0] == str(user.id) else participant_ids[0]
        if workspace_id:
            workspace = Workspace.objects.filter(id=workspace_id).first()
            if workspace and WorkspaceMember.objects.filter(
                workspace=workspace,
                user=user,
                status=WorkspaceMember.Status.ACCEPTED,
            ).exists():
                context['workspaceId'] = str(workspace.id)
                context['workspace'] = workspace
        return context

    return None


def ensure_notifications_channel(user_id):
    return f'user_{user_id}'


def get_message_collection():
    return get_mongo_db()['chat_messages']


def ensure_chat_indexes():
    collection = get_message_collection()
    collection.create_index([('roomId', 1), ('createdAt', -1)], name='chat_room_created_idx')
    collection.create_index([('workspaceId', 1), ('createdAt', -1)], name='chat_workspace_created_idx')
    collection.create_index([('taskId', 1), ('createdAt', -1)], name='chat_task_created_idx')
    collection.create_index([('receiverId', 1), ('createdAt', -1)], name='chat_receiver_created_idx')
    collection.create_index([('chatType', 1), ('createdAt', -1)], name='chat_type_created_idx')


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
        'readBy': [str(user_id) for user_id in document.get('readBy', [])],
        'isEdited': document.get('editedAt') is not None,
        'isDeleted': document.get('deletedAt') is not None,
    }


def build_thread_preview(message_document):
    message = serialize_message(message_document)
    preview_text = message.get('message') or message.get('attachmentName') or 'Attachment'
    if message.get('isDeleted'):
        preview_text = 'Message deleted'
    return {
        'roomId': message['roomId'],
        'chatType': message['chatType'],
        'workspaceId': message.get('workspaceId'),
        'taskId': message.get('taskId'),
        'receiverId': message.get('receiverId'),
        'senderId': message.get('senderId'),
        'sender': message.get('sender'),
        'lastMessage': preview_text,
        'lastMessageAt': message.get('createdAt'),
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

    return {
        'messages': messages,
        'hasMore': has_more,
        'nextCursor': next_cursor,
    }


def mark_messages_read(*, room, user_id):
    collection = get_message_collection()
    collection.update_many(
        {
            'roomId': room,
            'senderId': {'$ne': str(user_id)},
        },
        {
            '$addToSet': {'readBy': str(user_id)},
            '$set': {'updatedAt': timezone.now()},
        },
    )


def edit_message(*, message_id, user_id, message=None, attachment=None):
    collection = get_message_collection()
    document = collection.find_one({'_id': ObjectId(message_id)})
    if not document:
        return None
    if document.get('senderId') != str(user_id):
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
    if not document:
        return None
    if document.get('senderId') != str(user_id):
        return None

    updates = {
        'message': '',
        'attachment': None,
        'deletedAt': timezone.now(),
        'updatedAt': timezone.now(),
    }
    collection.update_one({'_id': document['_id']}, {'$set': updates})
    document.update(updates)
    return serialize_message(document)


def get_workspace_chat_context(*, workspace_id, task_id=None, user=None, direct_user_id=None):
    if task_id:
        task = Task.objects.select_related('workspace', 'project', 'assignee', 'created_by').filter(id=task_id).first()
        if not task:
            return None
        if not WorkspaceMember.objects.filter(workspace=task.workspace, user=user, status=WorkspaceMember.Status.ACCEPTED).exists():
            return None
        return {
            'roomId': build_task_room(task.id),
            'chatType': 'task',
            'workspaceId': str(task.workspace_id),
            'taskId': str(task.id),
            'title': task.title,
            'subtitle': task.workspace.name,
            'participants': [],
        }

    if direct_user_id:
        other_user = User.objects.filter(id=direct_user_id).first()
        if not other_user:
            return None
        workspace = Workspace.objects.filter(id=workspace_id).first() if workspace_id else None
        if workspace and not WorkspaceMember.objects.filter(workspace=workspace, user=user, status=WorkspaceMember.Status.ACCEPTED).exists():
            return None
        return {
            'roomId': build_direct_room(user.id, other_user.id),
            'chatType': 'direct',
            'workspaceId': str(workspace.id) if workspace else None,
            'taskId': None,
            'receiverId': str(other_user.id),
            'title': other_user.full_name,
            'subtitle': 'Direct message',
            'participants': [
                _user_summary(user.id),
                _user_summary(other_user.id),
            ],
        }

    workspace = Workspace.objects.filter(id=workspace_id).first()
    if not workspace:
        return None
    if not WorkspaceMember.objects.filter(workspace=workspace, user=user, status=WorkspaceMember.Status.ACCEPTED).exists():
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
    workspace = Workspace.objects.filter(id=workspace_id).first()
    if not workspace:
        return None
    if not WorkspaceMember.objects.filter(workspace=workspace, user=user, status=WorkspaceMember.Status.ACCEPTED).exists():
        return None

    collection = get_message_collection()
    threads = []

    def summarize_room(room_name, chat_type, title, subtitle, workspace_value=None, task_value=None, receiver_value=None, limit_to_user=None):
        query = {'roomId': room_name}
        latest = collection.find(query).sort('createdAt', -1).limit(1)
        latest_doc = next(iter(latest), None)
        last_message = serialize_message(latest_doc) if latest_doc else None
        unread_query = {
            'roomId': room_name,
            'senderId': {'$ne': str(user.id)},
            'readBy': {'$ne': str(user.id)},
            'deletedAt': {'$exists': False},
        }
        unread_count = collection.count_documents(unread_query)
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

    threads.append(summarize_room(build_workspace_room(workspace.id), 'workspace', workspace.name, 'Workspace chat', workspace_value=str(workspace.id)))

    if task_id:
        task = Task.objects.select_related('workspace').filter(id=task_id, workspace=workspace).first()
        if task:
            threads.append(summarize_room(build_task_room(task.id), 'task', task.title, task.workspace.name, workspace_value=str(workspace.id), task_value=str(task.id)))

    member_ids = list(
        WorkspaceMember.objects.filter(workspace=workspace, status=WorkspaceMember.Status.ACCEPTED)
        .exclude(user=user)
        .values_list('user_id', flat=True)
    )

    direct_query = {
        'chatType': 'direct',
        'workspaceId': str(workspace.id),
        '$or': [
            {'senderId': str(user.id)},
            {'receiverId': str(user.id)},
        ],
    }
    if member_ids:
        direct_query['$or'] = [
            {'senderId': str(user.id), 'receiverId': {'$in': [str(member_id) for member_id in member_ids]}},
            {'receiverId': str(user.id), 'senderId': {'$in': [str(member_id) for member_id in member_ids]}},
        ]

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
        unread_count = collection.count_documents({
            'roomId': latest_doc['roomId'],
            'senderId': {'$ne': str(user.id)},
            'readBy': {'$ne': str(user.id)},
            'deletedAt': {'$exists': False},
        })
        threads.append({
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
        })

    return {
        'workspace': {
            'id': str(workspace.id),
            'name': workspace.name,
            'icon': workspace.icon,
            'color': workspace.color,
        },
        'threads': threads,
        'members': [
            {
                'id': str(member.user.id),
                'full_name': member.user.full_name,
                'email': member.user.email,
                'avatar': member.user.avatar.url if member.user.avatar else None,
                'initials': member.user.initials,
                'role': member.role,
            }
            for member in WorkspaceMember.objects.select_related('user').filter(workspace=workspace, status=WorkspaceMember.Status.ACCEPTED)
        ],
    }


def build_notification_payload(*, message, title, subtitle, room_id, unread_count=1):
    return {
        'type': 'chat_notification',
        'roomId': room_id,
        'title': title,
        'subtitle': subtitle,
        'unreadCount': unread_count,
        'message': message,
    }