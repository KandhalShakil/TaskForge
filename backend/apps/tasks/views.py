import uuid

from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.core.cache import cache
from apps.workspaces.documents import WorkspaceMemberDocument
from apps.core.permissions import IsWorkspaceMemberOrAdmin, IsTaskOwnerOrAdmin, CompanyTenantMixin

from .documents import CategoryDocument, CommentDocument, SubTaskDocument, TaskDocument
from apps.users.emails import send_html_email
from apps.users.documents import UserDocument
from apps.projects.documents import ProjectDocument
from django.template.loader import render_to_string
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def _send_task_assignment_email(task, request):
    assignee_id = task.assigneeId
    if not assignee_id:
        return
        
    assignee = UserDocument.objects(id=str(assignee_id)).first()
    if not assignee or not assignee.email:
        return
        
    # Handle both TaskDocument and SubTaskDocument
    project_id = None
    if hasattr(task, 'projectId') and task.projectId:
        project_id = task.projectId
    elif hasattr(task, 'taskId') and task.taskId:
        parent_task = TaskDocument.objects(id=str(task.taskId)).first()
        if parent_task:
            project_id = parent_task.projectId

    project = ProjectDocument.objects(id=str(project_id)).first() if project_id else None
    project_name = project.name if project else "General"

    try:
        due_date_str = task.due_date.strftime('%B %d, %Y') if task.due_date else "No due date"
        
        html_message = render_to_string('emails/task_assigned.html', {
            'assignee_name': assignee.full_name,
            'task_title': task.title,
            'project_name': project_name,
            'due_date': due_date_str,
            'task_url': f"{settings.FRONTEND_URL}/tasks/{task.id}"
        })
        
        send_html_email(
            subject=f"New Task Assigned: {task.title}",
            plain_body=f"Hi {assignee.full_name}, you have been assigned to '{task.title}' in project {project_name}.",
            html_body=html_message,
            recipient=assignee.email,
        )
    except Exception:
        logger.exception(f"Failed to send task assignment email to {assignee.email}")
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
        _send_task_assignment_email(subtask, self.request)


class SubTaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin, IsTaskOwnerOrAdmin]
    serializer_class = SubTaskSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'pk'

    def get_queryset(self):
        task_ids = [
            str(task.id)
            for task in TaskDocument.objects(workspaceId__in=_member_workspace_ids(self.request.user.id)).only('id')
        ]
        return SubTaskDocument.objects(taskId__in=task_ids)


    def perform_update(self, serializer):
        old_assignee = self.get_object().assigneeId
        subtask = serializer.save(updated_at=timezone.now())
        if subtask.assigneeId and subtask.assigneeId != old_assignee:
            _send_task_assignment_email(subtask, self.request)

class TaskListCreateView(CompanyTenantMixin, generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin]
    document_class = TaskDocument

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return TaskListSerializer
        return TaskSerializer

    def perform_create(self, serializer):
        # 1. Validate dates against project
        project_id = serializer.validated_data.get('projectId')
        if project_id:
            project = ProjectDocument.objects(id=str(project_id)).first()
            if project:
                start_date = serializer.validated_data.get('start_date')
                due_date = serializer.validated_data.get('due_date')
                
                if start_date and project.start_date and start_date < project.start_date:
                    raise ValidationError({'start_date': f"Task cannot start before project start ({project.start_date.date()})"})
                if due_date and project.end_date and due_date > project.end_date:
                    raise ValidationError({'due_date': f"Task cannot end after project end ({project.end_date.date()})"})

        # 2. Save with companyId
        task = serializer.save(
            createdById=str(self.request.user.id),
            companyId=str(self.request.user.companyId)
        )
        _send_task_assignment_email(task, self.request)

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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        # Paginate if needed
        page = self.paginate_queryset(queryset)
        tasks = list(page) if page is not None else list(queryset)
        
        if not tasks:
            return self.get_paginated_response([]) if page is not None else Response([])

        # Bulk fetch related data
        task_ids = [str(t.id) for t in tasks]
        
        # 1. Categories
        cat_ids = list(set(str(t.categoryId) for t in tasks if getattr(t, 'categoryId', None)))
        categories = {str(c.id): c for c in CategoryDocument.objects(id__in=cat_ids)}
        
        # 2. Subtasks (only root level for listing)
        subtasks_qs = SubTaskDocument.objects(taskId__in=task_ids, parentId__in=[None, ''])
        task_subtasks = {}
        for st in subtasks_qs:
            t_id = str(st.taskId)
            if t_id not in task_subtasks:
                task_subtasks[t_id] = []
            task_subtasks[t_id].append(st)
            
        # 3. Comment Counts
        # MongoDB aggregation for counts
        from apps.core.mongo import get_mongo_db
        db = get_mongo_db()
        pipeline = [
            {"$match": {"taskId": {"$in": task_ids}}},
            {"$group": {"_id": "$taskId", "count": {"$sum": 1}}}
        ]
        comment_counts = {item['_id']: item['count'] for item in db.task_comments.aggregate(pipeline)}

        context = self.get_serializer_context()
        context.update({
            'bulk_categories': categories,
            'bulk_subtasks': task_subtasks,
            'bulk_comment_counts': comment_counts
        })

        serializer = self.get_serializer(tasks, many=True, context=context)
        
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)


class TaskDetailView(CompanyTenantMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsWorkspaceMemberOrAdmin, IsTaskOwnerOrAdmin]
    serializer_class = TaskSerializer
    document_class = TaskDocument
    lookup_field = 'id'
    lookup_url_kwarg = 'pk'

    def perform_update(self, serializer):
        # Validate dates if changed
        project_id = self.get_object().projectId
        if project_id:
            project = ProjectDocument.objects(id=str(project_id)).first()
            if project:
                start_date = serializer.validated_data.get('start_date')
                due_date = serializer.validated_data.get('due_date')
                
                if start_date and project.start_date and start_date < project.start_date:
                    raise ValidationError({'start_date': f"Task cannot start before project start ({project.start_date.date()})"})
                if due_date and project.end_date and due_date > project.end_date:
                    raise ValidationError({'due_date': f"Task cannot end after project end ({project.end_date.date()})"})

        old_assignee = self.get_object().assigneeId
        task = serializer.save(updated_at=timezone.now())
        if task.assigneeId and task.assigneeId != old_assignee:
            _send_task_assignment_email(task, self.request)


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
        user_id = str(request.user.id)

        # Build a cache key based on user and filters
        cache_key = f"task_stats_{user_id}_{workspace_id or 'all'}_{project_id or 'all'}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

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

        stats = {
            'total': total,
            'completion_rate': completion_rate,
            'overdue': overdue_count,
            'by_status': status_counts,
            'by_priority': priority_counts,
            'daily_created': [
                {'date': date_str, 'count': daily_map[date_str]} for date_str in sorted(daily_map.keys())
            ],
        }

        # Cache for 5 minutes
        cache.set(cache_key, stats, timeout=300)
        return Response(stats)


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
