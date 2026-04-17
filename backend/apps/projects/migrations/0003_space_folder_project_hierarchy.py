from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0002_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Space',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('icon', models.CharField(default='🧭', max_length=10)),
                ('color', models.CharField(default='#3b82f6', max_length=7)),
                ('order', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_spaces', to=settings.AUTH_USER_MODEL)),
                ('workspace', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='spaces', to='workspaces.workspace')),
            ],
            options={
                'db_table': 'spaces',
                'ordering': ['order', 'created_at'],
                'unique_together': {('workspace', 'name')},
            },
        ),
        migrations.CreateModel(
            name='Folder',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('icon', models.CharField(default='🗂️', max_length=10)),
                ('color', models.CharField(default='#8b5cf6', max_length=7)),
                ('order', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_folders', to=settings.AUTH_USER_MODEL)),
                ('space', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='folders', to='projects.space')),
                ('workspace', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='folders', to='workspaces.workspace')),
            ],
            options={
                'db_table': 'folders',
                'ordering': ['order', 'created_at'],
                'unique_together': {('space', 'name')},
            },
        ),
        migrations.AddField(
            model_name='project',
            name='folder',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='projects', to='projects.folder'),
        ),
        migrations.AddField(
            model_name='project',
            name='order',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='project',
            name='space',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='projects', to='projects.space'),
        ),
    ]
