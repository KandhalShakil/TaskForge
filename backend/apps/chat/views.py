from __future__ import annotations

import uuid
from datetime import datetime

from bs4 import BeautifulSoup
from django.core.files.storage import default_storage
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import (
    edit_message,
    get_workspace_chat_context,
    list_messages,
    list_threads_for_workspace,
    mark_messages_read,
    delete_message,
    store_message,
    validate_room_access,
)


def _sanitize_message_text(raw_value):
    if raw_value is None:
        return ''
    text = BeautifulSoup(str(raw_value), 'html.parser').get_text(separator=' ', strip=True)
    return ' '.join(text.split())


class ChatContextView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        workspace_id = request.query_params.get('workspace_id')
        task_id = request.query_params.get('task_id')
        direct_user_id = request.query_params.get('direct_user_id')

        context = get_workspace_chat_context(
            workspace_id=workspace_id,
            task_id=task_id,
            direct_user_id=direct_user_id,
            user=request.user,
        )
        if not context:
            return Response({'detail': 'Chat room not found or access denied.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(context)


class ChatThreadListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        workspace_id = request.query_params.get('workspace_id')
        task_id = request.query_params.get('task_id')

        if not workspace_id:
            return Response({'detail': 'workspace_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        payload = list_threads_for_workspace(workspace_id=workspace_id, task_id=task_id, user=request.user)
        if not payload:
            return Response({'detail': 'Workspace not found or access denied.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(payload)


class ChatMessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        room = request.query_params.get('room')
        if not room:
            return Response({'detail': 'room is required.'}, status=status.HTTP_400_BAD_REQUEST)

        workspace_id = request.query_params.get('workspace_id')
        context = validate_room_access(request.user, room, workspace_id=workspace_id)
        if not context:
            return Response({'detail': 'Room not found or access denied.'}, status=status.HTTP_404_NOT_FOUND)

        limit = min(int(request.query_params.get('limit', 30)), 100)
        before = request.query_params.get('before')
        before_value = datetime.fromisoformat(before) if before else None

        payload = list_messages(room=room, limit=limit, before=before_value, user_id=request.user.id)
        return Response(payload)


class ChatSendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        room = request.data.get('room')
        message_text = _sanitize_message_text(request.data.get('message'))
        attachment = request.data.get('attachment')

        if not room:
            return Response({'detail': 'room is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not message_text and not attachment:
            return Response({'detail': 'message or attachment is required.'}, status=status.HTTP_400_BAD_REQUEST)

        workspace_id = request.data.get('workspace_id')
        context = validate_room_access(request.user, room, workspace_id=workspace_id)
        if not context:
            return Response({'detail': 'Room not found or access denied.'}, status=status.HTTP_404_NOT_FOUND)

        message = store_message(
            room=room,
            chat_type=context['chatType'],
            sender_id=request.user.id,
            message=message_text,
            workspace_id=context.get('workspaceId'),
            task_id=context.get('taskId'),
            receiver_id=context.get('receiverId'),
            attachment=attachment,
            client_message_id=request.data.get('clientMessageId'),
        )

        # Real-time broadcasting is handled by the Socket.IO server.
        # The frontend emits 'send_message' after receiving this response.
        return Response(message, status=status.HTTP_201_CREATED)


class ChatMessageDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, message_id):
        next_message = request.data.get('message')
        message = edit_message(
            message_id=message_id,
            user_id=request.user.id,
            message=_sanitize_message_text(next_message) if next_message is not None else None,
            attachment=request.data.get('attachment'),
        )
        if not message:
            return Response({'detail': 'Message not found or permission denied.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(message)

    def delete(self, request, message_id):
        message = delete_message(message_id=message_id, user_id=request.user.id)
        if not message:
            return Response({'detail': 'Message not found or permission denied.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChatMessageReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        room = request.data.get('room')
        if not room:
            return Response({'detail': 'room is required.'}, status=status.HTTP_400_BAD_REQUEST)

        workspace_id = request.data.get('workspace_id')
        context = validate_room_access(request.user, room, workspace_id=workspace_id)
        if not context:
            return Response({'detail': 'Room not found or access denied.'}, status=status.HTTP_404_NOT_FOUND)

        mark_messages_read(room=room, user_id=request.user.id)
        return Response({'status': 'ok'})


class ChatAttachmentUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        upload = request.FILES.get('file')
        if not upload:
            return Response({'detail': 'file is required.'}, status=status.HTTP_400_BAD_REQUEST)

        file_name = upload.name
        storage_path = default_storage.save(f'chat_uploads/{uuid.uuid4().hex}_{file_name}', upload)
        file_url = default_storage.url(storage_path)

        return Response(
            {
                'url': file_url,
                'name': file_name,
                'type': getattr(upload, 'content_type', None),
                'size': upload.size,
            },
            status=status.HTTP_201_CREATED,
        )