from datetime import datetime

from django_mongoengine import Document, fields


class UserDocument(Document):
    id = fields.StringField(primary_key=True)
    email = fields.EmailField()
    full_name = fields.StringField(max_length=255)
    avatar = fields.StringField(blank=True, default='')
    user_type = fields.StringField(choices=('admin', 'owner', 'employee'), default='employee')
    companyId = fields.StringField(blank=True, null=True)
    is_active = fields.BooleanField(default=True)
    is_deleted = fields.BooleanField(default=False)
    is_staff = fields.BooleanField(default=False)
    is_superuser = fields.BooleanField(default=False)
    password = fields.StringField()
    date_joined = fields.DateTimeField(default=datetime.utcnow)
    updated_at = fields.DateTimeField(default=datetime.utcnow)
    settings = fields.DictField(default={
        'notifications': {
            'email': True,
            'chat': True,
            'tasks': True
        },
        'appearance': {
            'theme': 'dark'
        }
    })

    meta = {
        'collection': 'users',
        'ordering': ['-date_joined'],
        'indexes': [
            {'fields': ['email'], 'unique': True, 'name': 'users_email_unique'},
            'user_type',
            'companyId',
        ],
    }
