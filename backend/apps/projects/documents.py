from datetime import datetime

from django_mongoengine import Document, fields


class SpaceDocument(Document):
    id = fields.StringField(primary_key=True)
    workspaceId = fields.StringField()
    name = fields.StringField(max_length=255)
    description = fields.StringField()
    icon = fields.StringField(default='🧭')
    color = fields.StringField(default='#3b82f6')
    order = fields.IntField(default=0)
    createdById = fields.StringField()
    created_at = fields.DateTimeField(default=datetime.utcnow)
    updated_at = fields.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'spaces',
        'ordering': ['order', 'created_at'],
        'indexes': ['workspaceId', 'name'],
    }


class FolderDocument(Document):
    id = fields.StringField(primary_key=True)
    workspaceId = fields.StringField()
    spaceId = fields.StringField()
    name = fields.StringField(max_length=255)
    description = fields.StringField()
    icon = fields.StringField(default='🗂️')
    color = fields.StringField(default='#8b5cf6')
    order = fields.IntField(default=0)
    createdById = fields.StringField()
    created_at = fields.DateTimeField(default=datetime.utcnow)
    updated_at = fields.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'folders',
        'ordering': ['order', 'created_at'],
        'indexes': ['workspaceId', 'spaceId', 'name'],
    }


class ProjectDocument(Document):
    id = fields.StringField(primary_key=True)
    workspaceId = fields.StringField()
    spaceId = fields.StringField(blank=True, default='')
    folderId = fields.StringField(blank=True, default='')
    name = fields.StringField(max_length=255)
    description = fields.StringField()
    icon = fields.StringField(default='📁')
    color = fields.StringField(default='#8b5cf6')
    status = fields.StringField(choices=('active', 'archived', 'completed'), default='active')
    ownerId = fields.StringField()
    start_date = fields.DateTimeField(null=True, blank=True, default=None)
    end_date = fields.DateTimeField(null=True, blank=True, default=None)
    order = fields.IntField(default=0)
    created_at = fields.DateTimeField(default=datetime.utcnow)
    updated_at = fields.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'projects',
        'ordering': ['-created_at'],
        'indexes': ['workspaceId', 'status', 'name'],
    }


class ProjectMemberDocument(Document):
    id = fields.StringField(primary_key=True)
    projectId = fields.StringField()
    userId = fields.StringField()
    role = fields.StringField(choices=('manager', 'member', 'viewer'), default='member')
    joined_at = fields.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'project_members',
        'indexes': ['projectId', 'userId', 'role'],
    }
