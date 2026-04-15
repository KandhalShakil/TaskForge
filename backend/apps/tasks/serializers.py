from rest_framework import serializers
from apps.users.serializers import UserSerializer
from django.contrib.auth import get_user_model
from .models import Task, Category, Comment, SubTask


User = get_user_model()


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'workspace', 'name', 'color', 'created_at']
        read_only_fields = ['id', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'task', 'author', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']
        
class SubTaskSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    assignee_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    parent_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    children = serializers.SerializerMethodField()

    class Meta: 
        model = SubTask
        fields = [
            'id', 'task', 'parent', 'parent_id', 'title',
            'status', 'priority',
            'assignee', 'assignee_id',
            'start_date', 'due_date', 'estimated_hours',
            'is_completed',
            'order', 'children', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'parent', 'task', 'children', 'created_at', 'updated_at']

    def get_children(self, obj):
        children_qs = obj.children.select_related('assignee').order_by('order', 'created_at')
        return SubTaskSerializer(children_qs, many=True, context=self.context).data

    def validate(self, attrs):
        assignee_id = attrs.pop('assignee_id', serializers.empty)
        if assignee_id is not serializers.empty:
            if assignee_id is None:
                attrs['assignee'] = None
            else:
                assignee = User.objects.filter(id=assignee_id).first()
                if not assignee:
                    raise serializers.ValidationError({'assignee_id': 'Assignee does not exist.'})
                attrs['assignee'] = assignee

        parent_id = attrs.pop('parent_id', serializers.empty)
        if parent_id is serializers.empty:
            return attrs

        if parent_id is None:
            attrs['parent'] = None
            return attrs

        parent = SubTask.objects.filter(id=parent_id).first()
        if not parent:
            raise serializers.ValidationError({'parent_id': 'Parent subtask does not exist.'})

        task = attrs.get('task')
        instance = getattr(self, 'instance', None)
        if task is None and instance is not None:
            task = instance.task

        if task is not None and parent.task_id != task.id:
            raise serializers.ValidationError({'parent_id': 'Parent subtask must belong to the same task.'})

        if instance is not None:
            if instance.id == parent.id:
                raise serializers.ValidationError({'parent_id': 'Subtask cannot be its own parent.'})

            cursor = parent
            while cursor is not None:
                if cursor.id == instance.id:
                    raise serializers.ValidationError({'parent_id': 'Cyclic subtask hierarchy is not allowed.'})
                cursor = cursor.parent

        attrs['parent'] = parent
        return attrs
        
class SubTaskCreateItemSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500)
    status = serializers.ChoiceField(choices=Task.Status.choices, required=False, default=Task.Status.TODO)
    priority = serializers.ChoiceField(choices=Task.Priority.choices, required=False, default=Task.Priority.NO_PRIORITY)
    assignee_id = serializers.UUIDField(required=False, allow_null=True)
    start_date = serializers.DateField(required=False, allow_null=True)
    due_date = serializers.DateField(required=False, allow_null=True)
    estimated_hours = serializers.DecimalField(max_digits=5, decimal_places=1, required=True, allow_null=False)
    order = serializers.IntegerField(required=False, min_value=0)
    is_completed = serializers.BooleanField(required=False, default=False)
    children = serializers.ListSerializer(
        child=serializers.DictField(),
        required=False,
        allow_empty=True
    )

    def validate_children(self, value):
        serializer = SubTaskCreateItemSerializer(data=value, many=True)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data


class TaskSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    assignee_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    created_by = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    is_overdue = serializers.BooleanField(read_only=True)
    comment_count = serializers.SerializerMethodField()
    
    subtasks = serializers.SerializerMethodField()
    subtasks_input = SubTaskCreateItemSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = Task
        fields = [
            'id', 'workspace', 'project',
            'title', 'description', 'status', 'priority',
            'category', 'category_id',
            'assignee', 'assignee_id',
            'created_by',
            'due_date', 'start_date', 'estimated_hours',
            'order', 'is_overdue', 'comment_count',
            'subtasks', 'subtasks_input',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'is_overdue']

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_subtasks(self, obj):
        roots = obj.subtasks.filter(parent__isnull=True).select_related('assignee').order_by('order', 'created_at')
        return SubTaskSerializer(roots, many=True, context=self.context).data

    def _create_subtasks_tree(self, task, items, parent=None):
        for idx, item in enumerate(items):
            title = item['title'].strip()
            if not title:
                continue

            assignee = None
            assignee_id = item.get('assignee_id')
            if assignee_id:
                assignee = User.objects.filter(id=assignee_id).first()

            subtask = SubTask.objects.create(
                task=task,
                parent=parent,
                title=title,
                status=item.get('status', Task.Status.TODO),
                priority=item.get('priority', Task.Priority.NO_PRIORITY),
                assignee=assignee,
                start_date=item.get('start_date'),
                due_date=item.get('due_date'),
                estimated_hours=item.get('estimated_hours'),
                is_completed=item.get('is_completed', False),
                order=item.get('order', idx),
            )
            children = item.get('children', [])
            if children:
                self._create_subtasks_tree(task, children, parent=subtask)

    def create(self, validated_data):
        self.subtasks_input = validated_data.pop('subtasks_input', [])
        validated_data['created_by'] = self.context['request'].user
        task = super().create(validated_data)
        
        if self.subtasks_input:
            self._create_subtasks_tree(task, self.subtasks_input)
        return task


class TaskListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    assignee = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'assignee', 'category',
            'due_date', 'start_date', 'estimated_hours',
            'order', 'is_overdue',
            'created_at', 'updated_at'
        ]


class BulkUpdateTaskSerializer(serializers.Serializer):
    """For Kanban drag-and-drop bulk updates."""
    tasks = serializers.ListField(
        child=serializers.DictField()
    )

    def update_tasks(self):
        tasks_data = self.validated_data['tasks']
        updated = []
        for task_data in tasks_data:
            task_id = task_data.get('id')
            try:
                task = Task.objects.get(id=task_id)
                if 'status' in task_data:
                    task.status = task_data['status']
                if 'order' in task_data:
                    task.order = task_data['order']
                task.save(update_fields=['status', 'order', 'updated_at'])
                updated.append(task)
            except Task.DoesNotExist:
                pass
        return updated
    
    