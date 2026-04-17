import uuid
from django.db import models
from django.conf import settings
from apps.workspaces.models import Workspace


class Space(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace, on_delete=models.CASCADE, related_name='spaces'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10, default='🧭')
    color = models.CharField(max_length=7, default='#3b82f6')
    order = models.IntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_spaces'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'spaces'
        ordering = ['order', 'created_at']
        unique_together = ['workspace', 'name']

    def __str__(self):
        return f'{self.workspace.name} / {self.name}'


class Folder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace, on_delete=models.CASCADE, related_name='folders'
    )
    space = models.ForeignKey(
        Space, on_delete=models.CASCADE, related_name='folders'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10, default='🗂️')
    color = models.CharField(max_length=7, default='#8b5cf6')
    order = models.IntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_folders'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'folders'
        ordering = ['order', 'created_at']
        unique_together = ['space', 'name']

    def __str__(self):
        return f'{self.space.name} / {self.name}'


class Project(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        ARCHIVED = 'archived', 'Archived'
        COMPLETED = 'completed', 'Completed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace, on_delete=models.CASCADE, related_name='projects'
    )
    space = models.ForeignKey(
        Space, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects'
    )
    folder = models.ForeignKey(
        Folder, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10, default='📁')
    color = models.CharField(max_length=7, default='#8b5cf6')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='owned_projects'
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.workspace.name} / {self.name}'


class ProjectMember(models.Model):
    class Role(models.TextChoices):
        MANAGER = 'manager', 'Manager'
        MEMBER = 'member', 'Member'
        VIEWER = 'viewer', 'Viewer'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name='members'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_memberships'
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_members'
        unique_together = ['project', 'user']

    def __str__(self):
        return f'{self.user.email} - {self.project.name}'
