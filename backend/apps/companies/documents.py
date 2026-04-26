from datetime import datetime
from django_mongoengine import Document, fields

class CompanyDocument(Document):
    id = fields.StringField(primary_key=True)
    name = fields.StringField(unique=True, max_length=255)
    createdBy = fields.StringField()
    createdAt = fields.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'companies',
        'ordering': ['-createdAt'],
        'indexes': [
            {'fields': ['name'], 'unique': True},
        ],
    }
