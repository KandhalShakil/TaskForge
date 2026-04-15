from rest_framework import serializers
from apps.users.serializers import UserSerializer
from .models import Task, Category, Comment, SubTask


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
    class Meta: 
        model = SubTask
        fields = ['id', 'task', 'title', 'is_completed', 'order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        

class SubTaskCreateItemSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500)
    order = serializers.IntegerField(required=False, min_value=0)


class TaskSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    assignee_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    created_by = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    is_overdue = serializers.BooleanField(read_only=True)
    comment_count = serializers.SerializerMethodField()
    
    subtasks = SubTaskSerializer(many=True, read_only=True)
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

    def create(self, validated_data):
        self.subtasks_input = validated_data.pop('subtasks_input', [])
        validated_data['created_by'] = self.context['request'].user
        task = super().create(validated_data)
        
        if self.subtasks_input:
            SubTask.objects.bulk_create([SubTask(task=task, title=item['title'].strip(), order=item.get('order', idx)) for idx , item in enumerate(self.subtasks_input) if item['title'].strip()])
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
    
    