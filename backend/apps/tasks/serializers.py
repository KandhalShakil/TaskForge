import uuid

from bs4 import BeautifulSoup
from rest_framework import serializers

from apps.core.validation import (
    date_order_error,
    estimated_hours_errors,
    get_value,
    is_within_range,
    normalize_datetime,
    required_field_errors,
)
from apps.projects.documents import ProjectDocument
from apps.users.documents import UserDocument
from apps.users.serializers import UserSerializer

from .documents import CategoryDocument, CommentDocument, SubTaskDocument, TaskDocument


def clean_html(raw_html):
    if not raw_html:
        return ''
    soup = BeautifulSoup(raw_html, 'html.parser')
    return soup.get_text().strip()


class CategorySerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    workspace = serializers.CharField(source='workspaceId')
    name = serializers.CharField(max_length=100)
    color = serializers.CharField(required=False, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        category = CategoryDocument(
            id=str(uuid.uuid4()),
            workspaceId=validated_data['workspaceId'],
            name=validated_data['name'],
            color=validated_data.get('color', '#6366f1'),
        )
        category.save()
        return category

    def update(self, instance, validated_data):
        for key, field in (('workspaceId', 'workspaceId'), ('name', 'name'), ('color', 'color')):
            if key in validated_data:
                setattr(instance, field, validated_data[key])
        instance.save()
        return instance


class CommentSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    task = serializers.CharField(source='taskId', required=False)
    author = serializers.SerializerMethodField()
    content = serializers.CharField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def get_author(self, obj):
        user = UserDocument.objects(id=str(getattr(obj, 'authorId', ''))).first()
        return UserSerializer(user).data if user else None


class SubTaskSummarySerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    task = serializers.CharField(source='taskId', read_only=True)
    parent = serializers.CharField(source='parentId', read_only=True, allow_null=True)
    title = serializers.CharField(read_only=True)
    description = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)
    priority = serializers.CharField(read_only=True)
    category = serializers.SerializerMethodField()
    assignee = serializers.SerializerMethodField()
    start_date = serializers.DateTimeField(read_only=True, allow_null=True)
    due_date = serializers.DateTimeField(read_only=True, allow_null=True)
    estimated_hours = serializers.DecimalField(read_only=True, max_digits=6, decimal_places=1, allow_null=True)
    is_completed = serializers.BooleanField(read_only=True)
    order = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def get_category(self, obj):
        category_id = getattr(obj, 'categoryId', None)
        if not category_id:
            return None
        category = CategoryDocument.objects(id=str(category_id)).first()
        return CategorySerializer(category).data if category else None

    def get_assignee(self, obj):
        assignee_id = getattr(obj, 'assigneeId', None)
        if not assignee_id:
            return None
        user = UserDocument.objects(id=str(assignee_id)).first()
        return UserSerializer(user).data if user else None


class SubTaskSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    task = serializers.CharField(source='taskId', read_only=True)
    parent = serializers.CharField(source='parentId', read_only=True, allow_null=True)
    parent_id = serializers.CharField(write_only=True, required=False, allow_null=True)
    title = serializers.CharField(max_length=500)
    description = serializers.CharField(required=True, allow_blank=False)
    status = serializers.ChoiceField(choices=('todo', 'in_progress', 'in_review', 'done', 'cancelled'), default='todo')
    priority = serializers.ChoiceField(choices=('urgent', 'high', 'medium', 'low', 'no_priority'), default='no_priority')
    category = serializers.SerializerMethodField()
    category_id = serializers.CharField(write_only=True, required=False, allow_null=True)
    assignee = serializers.SerializerMethodField()
    assignee_id = serializers.CharField(write_only=True, required=True, allow_null=False)
    start_date = serializers.DateTimeField(required=True, allow_null=False)
    due_date = serializers.DateTimeField(required=True, allow_null=False)
    estimated_hours = serializers.DecimalField(max_digits=6, decimal_places=1, required=True, allow_null=False)
    is_completed = serializers.BooleanField(required=False, default=False)
    order = serializers.IntegerField(required=False, min_value=0, default=0)
    children = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def get_category(self, obj):
        category_id = getattr(obj, 'categoryId', None)
        if not category_id:
            return None
        category = CategoryDocument.objects(id=str(category_id)).first()
        return CategorySerializer(category).data if category else None

    def get_assignee(self, obj):
        assignee_id = getattr(obj, 'assigneeId', None)
        if not assignee_id:
            return None
        user = UserDocument.objects(id=str(assignee_id)).first()
        return UserSerializer(user).data if user else None

    def get_children(self, obj):
        children = SubTaskDocument.objects(parentId=str(obj.id)).order_by('order', 'created_at')
        return SubTaskSummarySerializer(children, many=True, context=self.context).data

    def validate(self, attrs):
        errors = required_field_errors(
            attrs,
            self.instance,
            [
                ('title', 'Title'),
                ('description', 'Description'),
                ('start_date', 'Start date'),
                ('due_date', 'End date'),
                ('priority', 'Priority'),
                ('assignee_id', 'Assignee'),
                ('estimated_hours', 'Estimated hours'),
            ],
            partial=getattr(self, 'partial', False),
        )
        if errors:
            raise serializers.ValidationError(errors)

        title = (attrs.get('title') or '').strip()
        if not title:
            raise serializers.ValidationError({'title': 'Title is required.'})
        attrs['title'] = title
        attrs['description'] = clean_html(attrs.get('description', ''))

        start_date = get_value(attrs, self.instance, 'start_date')
        due_date = get_value(attrs, self.instance, 'due_date')
        date_error = date_order_error(start_date, due_date)
        if date_error:
            raise serializers.ValidationError({'due_date': date_error, 'error': date_error})

        hours_error = estimated_hours_errors(start_date, due_date, get_value(attrs, self.instance, 'estimated_hours'))
        if hours_error:
            raise serializers.ValidationError({'estimated_hours': hours_error, 'error': hours_error})

        assignee_id = attrs.pop('assignee_id', None)
        if assignee_id:
            assignee = UserDocument.objects(id=str(assignee_id)).first()
            if not assignee:
                raise serializers.ValidationError({'assignee_id': 'Assignee does not exist.'})
            attrs['assigneeId'] = str(assignee.id)
        elif assignee_id is None:
            attrs.pop('assigneeId', None)

        category_id = attrs.pop('category_id', None)
        if category_id:
            category = CategoryDocument.objects(id=str(category_id)).first()
            if not category:
                raise serializers.ValidationError({'category_id': 'Category does not exist.'})
            attrs['categoryId'] = str(category.id)
        elif category_id is None:
            attrs.pop('categoryId', None)

        parent_id = attrs.pop('parent_id', serializers.empty)
        parent_obj = None
        if parent_id is not serializers.empty:
            if parent_id is None:
                attrs['parentId'] = None
            else:
                parent = SubTaskDocument.objects(id=str(parent_id)).first()
                if not parent:
                    raise serializers.ValidationError({'parent_id': 'Parent subtask does not exist.'})
                parent_obj = parent
                attrs['parentId'] = str(parent.id)
        elif self.instance and getattr(self.instance, 'parentId', None):
            parent_obj = SubTaskDocument.objects(id=str(self.instance.parentId)).first()

        if parent_obj:
            if not is_within_range(start_date, due_date, parent_obj.start_date, parent_obj.due_date):
                msg = 'Subtask must be within parent task date range'
                raise serializers.ValidationError({'error': msg, 'start_date': msg, 'due_date': msg})

        task_obj = None
        if self.instance and getattr(self.instance, 'taskId', None):
            task_obj = TaskDocument.objects(id=str(self.instance.taskId)).first()
        else:
            task_obj = self.context.get('task')

        if task_obj and not parent_obj:
            if not is_within_range(start_date, due_date, task_obj.start_date, task_obj.due_date):
                msg = 'Subtask must be within parent task date range'
                raise serializers.ValidationError({'error': msg, 'start_date': msg, 'due_date': msg})

        return attrs


class TaskSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    workspace = serializers.CharField(source='workspaceId')
    project = serializers.CharField(source='projectId', required=True, allow_null=False)
    title = serializers.CharField(max_length=500)
    description = serializers.CharField(required=True, allow_blank=False)
    status = serializers.ChoiceField(choices=('todo', 'in_progress', 'in_review', 'done', 'cancelled'), default='todo')
    priority = serializers.ChoiceField(choices=('urgent', 'high', 'medium', 'low', 'no_priority'), default='no_priority')
    category = serializers.SerializerMethodField()
    category_id = serializers.CharField(write_only=True, required=False, allow_null=True)
    assignee = serializers.SerializerMethodField()
    assignee_id = serializers.CharField(write_only=True, required=True, allow_null=False)
    created_by = serializers.SerializerMethodField()
    due_date = serializers.DateTimeField(required=True, allow_null=False)
    start_date = serializers.DateTimeField(required=True, allow_null=False)
    estimated_hours = serializers.DecimalField(max_digits=6, decimal_places=1, required=True, allow_null=False)
    order = serializers.IntegerField(required=False, min_value=0, default=0)
    is_overdue = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    subtasks = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def get_category(self, obj):
        category_id = getattr(obj, 'categoryId', None)
        if not category_id:
            return None
        category = CategoryDocument.objects(id=str(category_id)).first()
        return CategorySerializer(category).data if category else None

    def get_assignee(self, obj):
        assignee_id = getattr(obj, 'assigneeId', None)
        if not assignee_id:
            return None
        user = UserDocument.objects(id=str(assignee_id)).first()
        return UserSerializer(user).data if user else None

    def get_created_by(self, obj):
        created_by_id = getattr(obj, 'createdById', None)
        if not created_by_id:
            return None
        user = UserDocument.objects(id=str(created_by_id)).first()
        return UserSerializer(user).data if user else None

    def get_is_overdue(self, obj):
        from django.utils import timezone

        due_date = normalize_datetime(getattr(obj, 'due_date', None))
        status = getattr(obj, 'status', None)
        if due_date and status not in ('done', 'cancelled'):
            return due_date < timezone.now()
        return False

    def get_comment_count(self, obj):
        return CommentDocument.objects(taskId=str(obj.id)).count()

    def get_subtasks(self, obj):
        roots = SubTaskDocument.objects(taskId=str(obj.id), parentId__in=[None, '']).order_by('order', 'created_at')
        return SubTaskSummarySerializer(roots, many=True, context=self.context).data

    def validate(self, attrs):
        errors = required_field_errors(
            attrs,
            self.instance,
            [
                ('title', 'Title'),
                ('description', 'Description'),
                ('start_date', 'Start date'),
                ('due_date', 'End date'),
                ('priority', 'Priority'),
                ('assignee_id', 'Assignee'),
                ('category_id', 'Category'),
                ('estimated_hours', 'Estimated hours'),
                ('projectId', 'Project'),
            ],
            partial=getattr(self, 'partial', False),
        )
        if errors:
            raise serializers.ValidationError(errors)

        title = (attrs.get('title') or '').strip()
        if not title:
            raise serializers.ValidationError({'title': 'Title is required.'})
        attrs['title'] = title
        attrs['description'] = clean_html(attrs.get('description', ''))

        start_date = get_value(attrs, self.instance, 'start_date')
        due_date = get_value(attrs, self.instance, 'due_date')
        date_error = date_order_error(start_date, due_date)
        if date_error:
            raise serializers.ValidationError({'due_date': date_error, 'error': date_error})

        hours_error = estimated_hours_errors(start_date, due_date, get_value(attrs, self.instance, 'estimated_hours'))
        if hours_error:
            raise serializers.ValidationError({'estimated_hours': hours_error, 'error': hours_error})

        project_id = get_value(attrs, self.instance, 'projectId')
        project = ProjectDocument.objects(id=str(project_id)).first() if project_id else None
        if project:
            if not is_within_range(start_date, due_date, project.start_date, project.end_date):
                msg = 'Task date must be within project date range'
                raise serializers.ValidationError({'error': msg, 'start_date': msg, 'due_date': msg})

        assignee_id = attrs.pop('assignee_id', None)
        if assignee_id:
            assignee = UserDocument.objects(id=str(assignee_id)).first()
            if not assignee:
                raise serializers.ValidationError({'assignee_id': 'Assignee does not exist.'})
            attrs['assigneeId'] = str(assignee.id)
        elif assignee_id is None:
            attrs.pop('assigneeId', None)

        category_id = attrs.pop('category_id', None)
        if category_id:
            category = CategoryDocument.objects(id=str(category_id)).first()
            if not category:
                raise serializers.ValidationError({'category_id': 'Category does not exist.'})
            workspace_id = attrs.get('workspaceId') or getattr(self.instance, 'workspaceId', None)
            if workspace_id and str(category.workspaceId) != str(workspace_id):
                raise serializers.ValidationError({'category_id': 'Category must belong to the same workspace.'})
            attrs['categoryId'] = str(category.id)
        elif category_id is None:
            attrs.pop('categoryId', None)

        return attrs

    def create(self, validated_data):
        request = self.context['request']
        task = TaskDocument(
            id=str(uuid.uuid4()),
            workspaceId=validated_data['workspaceId'],
            projectId=validated_data.get('projectId'),
            title=validated_data['title'],
            description=validated_data.get('description', ''),
            status=validated_data.get('status', 'todo'),
            priority=validated_data.get('priority', 'no_priority'),
            categoryId=validated_data.get('categoryId'),
            assigneeId=validated_data.get('assigneeId'),
            createdById=str(request.user.id),
            due_date=validated_data.get('due_date'),
            start_date=validated_data.get('start_date'),
            estimated_hours=validated_data.get('estimated_hours'),
            order=validated_data.get('order', 0),
        )
        task.save()
        return task

    def update(self, instance, validated_data):
        for key in (
            'workspaceId',
            'projectId',
            'title',
            'description',
            'status',
            'priority',
            'categoryId',
            'assigneeId',
            'due_date',
            'start_date',
            'estimated_hours',
            'order',
        ):
            if key in validated_data:
                setattr(instance, key, validated_data[key])
        instance.save()
        return instance


class TaskListSerializer(TaskSerializer):
    pass


class BulkUpdateTaskSerializer(serializers.Serializer):
    tasks = serializers.ListField(child=serializers.DictField())

    def update_tasks(self):
        tasks_data = self.validated_data['tasks']
        updated = []
        for task_data in tasks_data:
            task_id = task_data.get('id')
            if not task_id:
                continue
            task = TaskDocument.objects(id=str(task_id)).first()
            if not task:
                continue
            if 'status' in task_data:
                task.status = task_data['status']
            if 'order' in task_data:
                task.order = task_data['order']
            task.save()
            updated.append(task)
        return updated
