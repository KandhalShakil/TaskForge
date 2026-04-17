from django.urls import path

from .views import (
    ChatAttachmentUploadView,
    ChatContextView,
    ChatMessageDetailView,
    ChatMessageListView,
    ChatMessageReadView,
    ChatSendMessageView,
    ChatThreadListView,
)


urlpatterns = [
    path('context/', ChatContextView.as_view(), name='chat-context'),
    path('threads/', ChatThreadListView.as_view(), name='chat-threads'),
    path('send-message/', ChatSendMessageView.as_view(), name='chat-send-message'),
    path('messages/', ChatMessageListView.as_view(), name='chat-messages'),
    path('messages/read/', ChatMessageReadView.as_view(), name='chat-read'),
    path('messages/<str:message_id>/', ChatMessageDetailView.as_view(), name='chat-message-detail'),
    path('upload/', ChatAttachmentUploadView.as_view(), name='chat-upload'),
]