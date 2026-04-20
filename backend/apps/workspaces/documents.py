from datetime import datetime

from django_mongoengine import Document, fields


class WorkspaceDocument(Document):
    id = fields.StringField(primary_key=True)
    name = fields.StringField(max_length=255)
    description = fields.StringField()
    icon = fields.StringField(default='🚀')
    color = fields.StringField(default='#6366f1')
    ownerId = fields.StringField()
    created_at = fields.DateTimeField(default=datetime.utcnow)
    updated_at = fields.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'workspaces',
        'ordering': ['-created_at'],
        'indexes': [
            {'fields': ['ownerId'], 'name': 'workspaces_owner_idx'},
            {'fields': ['name'], 'name': 'workspaces_name_idx'},
        ],
    }


class WorkspaceMemberDocument(Document):
    id = fields.StringField(primary_key=True)
    workspaceId = fields.StringField()
    userId = fields.StringField()
    role = fields.StringField(choices=('admin', 'member', 'viewer'), default='member')
    status = fields.StringField(choices=('pending', 'accepted', 'declined'), default='pending')
    joined_at = fields.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'workspace_members',
        'ordering': ['joined_at'],
        'indexes': [
            {'fields': ['workspaceId', 'userId'], 'unique': True, 'name': 'workspace_members_unique_idx'},
            {'fields': ['workspaceId'], 'name': 'workspaceId_1'},
            {'fields': ['userId'], 'name': 'userId_1'},
            {'fields': ['status'], 'name': 'status_1'},
        ],
    }
