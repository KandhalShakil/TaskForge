from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from .models import Task, Category, Comment
from .serializers import (
    TaskSerializer, TaskListSerializer, CategorySerializer,
    CommentSerializer, BulkUpdateTaskSerializer
)


class TaskFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name='status')
    priority = django_filters.CharFilter(field_name='priority')
    assignee = django_filters.UUIDFilter(field_name='assignee__id')
    category = django_filters.UUIDFilter(field_name='category__id')
    project = django_filters.UUIDFilter(field_name='project__id')
    workspace = django_filters.UUIDFilter(field_name='workspace__id')
    due_date_from = django_filters.DateFilter(field_name='due_date', lookup_expr='gte')
    due_date_to = django_filters.DateFilter(field_name='due_date', lookup_expr='lte')
    overdue = django_filters.BooleanFilter(method='filter_overdue')

    def filter_overdue(self, queryset, name, value):
        today = timezone.now().date()
        if value:
            return queryset.filter(
                due_date__lt=today
            ).exclude(status__in=['done', 'cancelled'])
        return queryset

    class Meta:
        model = Task
        fields = ['status', 'priority', 'assignee', 'category', 'project', 'workspace']


class TaskListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TaskFilter
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'due_date', 'priority', 'order']
    ordering = ['order', '-created_at']

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return TaskListSerializer
        return TaskSerializer

    def get_queryset(self):
        return Task.objects.filter(
            workspace__members__user=self.request.user
        ).select_related(
            'assignee', 'created_by', 'category', 'project'
        ).prefetch_related('comments').distinct()


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer

    def get_queryset(self):
        return Task.objects.filter(
            workspace__members__user=self.request.user
        ).select_related('assignee', 'created_by', 'category', 'project')


class TaskBulkUpdateView(APIView):
    """Bulk update task status/order — for Kanban drag-and-drop."""
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = BulkUpdateTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = serializer.update_tasks()
        return Response(
            TaskListSerializer(updated, many=True).data,
            status=status.HTTP_200_OK
        )


class TaskStatsView(APIView):
    """Analytics endpoint: task counts by status, priority, overdue."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        workspace_id = request.query_params.get('workspace')
        project_id = request.query_params.get('project')

        qs = Task.objects.filter(workspace__members__user=request.user)

        if workspace_id:
            qs = qs.filter(workspace_id=workspace_id)
        if project_id:
            qs = qs.filter(project_id=project_id)

        today = timezone.now().date()

        status_counts = {
            item['status']: item['count']
            for item in qs.values('status').annotate(count=Count('id'))
        }

        priority_counts = {
            item['priority']: item['count']
            for item in qs.values('priority').annotate(count=Count('id'))
        }

        overdue_count = qs.filter(
            due_date__lt=today
        ).exclude(status__in=['done', 'cancelled']).count()

        total = qs.count()
        completed = status_counts.get('done', 0)
        completion_rate = round((completed / total * 100), 1) if total > 0 else 0

        # Tasks created per day for the last 30 days
        from django.db.models.functions import TruncDate
        daily_created = list(
            qs.filter(
                created_at__gte=timezone.now() - timezone.timedelta(days=30)
            ).annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        return Response({
            'total': total,
            'completion_rate': completion_rate,
            'overdue': overdue_count,
            'by_status': status_counts,
            'by_priority': priority_counts,
            'daily_created': [
                {'date': str(d['date']), 'count': d['count']} for d in daily_created
            ],
        })


class CategoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CategorySerializer

    def get_queryset(self):
        qs = Category.objects.filter(workspace__members__user=self.request.user)
        workspace_id = self.request.query_params.get('workspace')
        if workspace_id:
            qs = qs.filter(workspace_id=workspace_id)
        return qs


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(workspace__members__user=self.request.user)


class CommentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CommentSerializer

    def get_queryset(self):
        task_id = self.kwargs['task_id']
        return Comment.objects.filter(
            task_id=task_id,
            task__workspace__members__user=self.request.user
        ).select_related('author')

    def perform_create(self, serializer):
        task_id = self.kwargs['task_id']
        task = get_object_or_404(
            Task,
            id=task_id,
            workspace__members__user=self.request.user
        )
        serializer.save(task=task, author=self.request.user)


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CommentSerializer

    def get_queryset(self):
        return Comment.objects.filter(
            task__workspace__members__user=self.request.user
        )

    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        if comment.author != request.user:
            return Response({'error': 'You can only delete your own comments.'}, status=status.HTTP_403_FORBIDDEN)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
