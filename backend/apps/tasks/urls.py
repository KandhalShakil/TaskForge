from django.urls import path
from .views import (
    TaskListCreateView, TaskDetailView, TaskBulkUpdateView, TaskStatsView,
    CategoryListCreateView, CategoryDetailView,
    CommentListCreateView, CommentDetailView,
    SubTaskListCreateView, SubTaskDetailView
)

urlpatterns = [
    path('', TaskListCreateView.as_view(), name='task-list'),
    path('bulk-update/', TaskBulkUpdateView.as_view(), name='task-bulk-update'),
    path('stats/', TaskStatsView.as_view(), name='task-stats'),
    path('<uuid:pk>/', TaskDetailView.as_view(), name='task-detail'),
    path('<uuid:task_id>/comments/', CommentListCreateView.as_view(), name='task-comments'),
    path('<uuid:task_id>/comments/<uuid:pk>/', CommentDetailView.as_view(), name='comment-detail'),
    path('<uuid:task_id>/subtasks/', SubTaskListCreateView.as_view(), name='task-subtasks'),
    path('subtasks/<uuid:pk>/', SubTaskDetailView.as_view(), name='subtask-detail'),
]

# Categories as a separate prefix in config/urls.py
# path('api/categories/', include('apps.tasks.category_urls'))
