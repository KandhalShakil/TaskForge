import uuid

from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsWorkspaceMemberOrAdmin
from apps.core.validation import normalize_datetime
from apps.workspaces.documents import WorkspaceMemberDocument

from .documents import CategoryDocument, CommentDocument, SubTaskDocument, TaskDocument
from .serializers import (
    BulkUpdateTaskSerializer,
    CategorySerializer,
    CommentSerializer,
    SubTaskSerializer,
    TaskListSerializer,
    TaskSerializer,
)


def _member_workspace_ids(user_id):
    return [
        m.workspaceId
        for m in WorkspaceMemberDocument.objects(userId=str(user_id), status='accepted')
    ]


def _can_access_task(user_id, task):
    if not task:
        return False
    return WorkspaceMemberDocument.objects(
        workspaceId=str(task.workspaceId),
        userId=str(user_id),
        status='accepted',
    ).first() is not None


def resolve_task_node(node_id, user=None):
    task = TaskDocument.objects(id=str(node_id)).first()
    if task:
        if user is None or _can_access_task(user.id, task):
            return task
        return None

    subtask = SubTaskDocument.objects(id=str(node_id)).first()
    if not subtask:
        return None

    task = TaskDocument.objects(id=str(subtask.taskId)).first()
    if not task:
        return None

    if user is not None and not _can_access_task(user.id, task):
        return None
    return subtask


class SubTaskListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = SubTaskSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        task_id = self.kwargs['task_id']
        node = resolve_task_node(task_id, self.request.user)
        if node is None:
            raise ValidationError({'task_id': 'Task or subtask context not found.'})

        if isinstance(node, TaskDocument):
            context['task'] = node
        else:
            context['task'] = TaskDocument.objects(id=str(node.taskId)).first()
        return context

    def get_queryset(self):
        task_id = self.kwargs['task_id']
        node = resolve_task_node(task_id, self.request.user)
        if node is None:
            return SubTaskDocument.objects(id='__none__')

        if isinstance(node, TaskDocument):
            return SubTaskDocument.objects(taskId=str(node.id), parentId__in=[None, '']).order_by('order', 'created_at')

        return SubTaskDocument.objects(taskId=str(node.taskId), parentId=str(node.id)).order_by('order', 'created_at')

    def perform_create(self, serializer):
        task_id = self.kwargs['task_id']
        node = resolve_task_node(task_id, self.request.user)
        if node is None:
            raise ValidationError({'task_id': 'Task or subtask context not found.'})

        if isinstance(node, TaskDocument):
            task = node
            parent_id = serializer.validated_data.get('parentId')
        else:
            task = TaskDocument.objects(id=str(node.taskId)).first()
            parent_id = serializer.validated_data.get('parentId') or str(node.id)

        if not task:
            raise ValidationError({'task_id': 'Task not found.'})

        if parent_id:
            parent = SubTaskDocument.objects(id=str(parent_id)).first()
            if not parent or str(parent.taskId) != str(task.id):
                raise ValidationError({'parent_id': 'Parent subtask must belong to the same task.'})

        payload = dict(serializer.validated_data)
        payload['taskId'] = str(task.id)
        payload['parentId'] = parent_id
        subtask = SubTaskDocument(id=str(uuid.uuid4()), **payload)
        subtask.save()


class SubTaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = SubTaskSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'pk'

    def get_queryset(self):
        task_ids = [
            str(task.id)
            for task in TaskDocument.objects(workspaceId__in=_member_workspace_ids(self.request.user.id)).only('id')
        ]
        return SubTaskDocument.objects(taskId__in=task_ids)


class TaskListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return TaskListSerializer
        return TaskSerializer

    def get_queryset(self):
        qs = TaskDocument.objects(workspaceId__in=_member_workspace_ids(self.request.user.id))

        workspace_id = self.request.query_params.get('workspace')
        if workspace_id:
            qs = qs.filter(workspaceId=str(workspace_id))

        project_id = self.request.query_params.get('project')
        if project_id:
            qs = qs.filter(projectId=str(project_id))

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        priority_filter = self.request.query_params.get('priority')
        if priority_filter:
            qs = qs.filter(priority=priority_filter)

        return qs.order_by('order', '-created_at')


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = TaskSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'pk'

    def get_queryset(self):
        return TaskDocument.objects(workspaceId__in=_member_workspace_ids(self.request.user.id))


class TaskBulkUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]

    def patch(self, request):
        serializer = BulkUpdateTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = serializer.update_tasks()
        return Response(TaskListSerializer(updated, many=True).data, status=status.HTTP_200_OK)


class TaskStatsView(APIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]

    def get(self, request):
        workspace_id = request.query_params.get('workspace')
        project_id = request.query_params.get('project')

        qs = TaskDocument.objects(workspaceId__in=_member_workspace_ids(request.user.id))

        if workspace_id:
            qs = qs.filter(workspaceId=str(workspace_id))
        if project_id:
            qs = qs.filter(projectId=str(project_id))

        tasks = list(qs)
        today = timezone.now()

        status_counts = {}
        priority_counts = {}
        overdue_count = 0
        daily_map = {}

        cutoff = timezone.now() - timezone.timedelta(days=30)
        for task in tasks:
            status_counts[task.status] = status_counts.get(task.status, 0) + 1
            priority_counts[task.priority] = priority_counts.get(task.priority, 0) + 1

            due_date = normalize_datetime(task.due_date)
            created_at = normalize_datetime(task.created_at)

            if due_date and due_date < today and task.status not in ('done', 'cancelled'):
                overdue_count += 1

            if created_at and created_at >= cutoff:
                key = created_at.date().isoformat()
                daily_map[key] = daily_map.get(key, 0) + 1

        total = len(tasks)
        completed = status_counts.get('done', 0)
        completion_rate = round((completed / total * 100), 1) if total > 0 else 0

        return Response(
            {
                'total': total,
                'completion_rate': completion_rate,
                'overdue': overdue_count,
                'by_status': status_counts,
                'by_priority': priority_counts,
                'daily_created': [
                    {'date': date_str, 'count': daily_map[date_str]} for date_str in sorted(daily_map.keys())
                ],
            }
        )


class CategoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = CategorySerializer

    def get_queryset(self):
        qs = CategoryDocument.objects(workspaceId__in=_member_workspace_ids(self.request.user.id))
        workspace_id = self.request.query_params.get('workspace')
        if workspace_id:
            qs = qs.filter(workspaceId=str(workspace_id))
        return qs


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = CategorySerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'pk'

    def get_queryset(self):
        return CategoryDocument.objects(workspaceId__in=_member_workspace_ids(self.request.user.id))


class CommentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = CommentSerializer

    def get_queryset(self):
        task_id = self.kwargs['task_id']
        task = TaskDocument.objects(id=str(task_id)).first()
        if not _can_access_task(self.request.user.id, task):
            return CommentDocument.objects(id='__none__')
        return CommentDocument.objects(taskId=str(task_id)).order_by('created_at')

    def perform_create(self, serializer):
        task_id = self.kwargs['task_id']
        task = TaskDocument.objects(id=str(task_id)).first()
        if not task or not _can_access_task(self.request.user.id, task):
            raise ValidationError({'task_id': 'Task not found.'})

        comment = CommentDocument(
            id=str(uuid.uuid4()),
            taskId=str(task.id),
            authorId=str(self.request.user.id),
            content=serializer.validated_data['content'],
        )
        comment.save()


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    serializer_class = CommentSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'pk'

    def get_queryset(self):
        task_ids = [
            str(task.id)
            for task in TaskDocument.objects(workspaceId__in=_member_workspace_ids(self.request.user.id)).only('id')
        ]
        return CommentDocument.objects(taskId__in=task_ids)

    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        task = TaskDocument.objects(id=str(comment.taskId)).first()
        if not task:
            return Response(status=status.HTTP_404_NOT_FOUND)

        is_admin = WorkspaceMemberDocument.objects(
            workspaceId=str(task.workspaceId),
            userId=str(request.user.id),
            role='admin',
            status='accepted',
        ).first()

        if str(comment.authorId) != str(request.user.id) and not is_admin:
            return Response(
                {'error': 'Only the author or a workspace admin can delete this comment.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
