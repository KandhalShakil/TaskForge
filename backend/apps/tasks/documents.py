from datetime import datetime

from django_mongoengine import Document, fields


class CategoryDocument(Document):
    id = fields.StringField(primary_key=True)
    workspaceId = fields.StringField()
    name = fields.StringField(max_length=100)
    color = fields.StringField(default='#6366f1')
    created_at = fields.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'categories',
        'ordering': ['name'],
        'indexes': ['workspaceId', 'name'],
    }


class TaskDocument(Document):
    id = fields.StringField(primary_key=True)
    workspaceId = fields.StringField()
    projectId = fields.StringField()
    title = fields.StringField(max_length=500)
    description = fields.StringField()
    status = fields.StringField(
        choices=('todo', 'in_progress', 'in_review', 'done', 'cancelled'),
        default='todo',
    )
    priority = fields.StringField(
        choices=('urgent', 'high', 'medium', 'low', 'no_priority'),
        default='no_priority',
    )
    categoryId = fields.StringField()
    assigneeId = fields.StringField()
    createdById = fields.StringField()
    due_date = fields.DateTimeField()
    start_date = fields.DateTimeField()
    estimated_hours = fields.DecimalField(precision=1)
    order = fields.IntField(default=0)
    created_at = fields.DateTimeField(default=datetime.utcnow)
    updated_at = fields.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'tasks',
        'ordering': ['order', '-created_at'],
        'indexes': ['workspaceId', 'projectId', 'status', 'assigneeId', 'due_date'],
    }


class CommentDocument(Document):
    id = fields.StringField(primary_key=True)
    taskId = fields.StringField()
    authorId = fields.StringField()
    content = fields.StringField()
    created_at = fields.DateTimeField(default=datetime.utcnow)
    updated_at = fields.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'task_comments',
        'ordering': ['created_at'],
        'indexes': ['taskId', 'authorId'],
    }


class SubTaskDocument(Document):
    id = fields.StringField(primary_key=True)
    taskId = fields.StringField()
    parentId = fields.StringField()
    title = fields.StringField(max_length=500)
    description = fields.StringField()
    status = fields.StringField(
        choices=('todo', 'in_progress', 'in_review', 'done', 'cancelled'),
        default='todo',
    )
    priority = fields.StringField(
        choices=('urgent', 'high', 'medium', 'low', 'no_priority'),
        default='no_priority',
    )
    categoryId = fields.StringField()
    assigneeId = fields.StringField()
    start_date = fields.DateTimeField()
    due_date = fields.DateTimeField()
    estimated_hours = fields.DecimalField(precision=1)
    is_completed = fields.BooleanField(default=False)
    order = fields.IntField(default=0)
    created_at = fields.DateTimeField(default=datetime.utcnow)
    updated_at = fields.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'subtasks',
        'ordering': ['order', 'created_at'],
        'indexes': ['taskId', 'parentId', 'order'],
    }
