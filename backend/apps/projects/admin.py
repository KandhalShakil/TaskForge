from django.contrib import admin
from .models import Project, ProjectMember, Space, Folder


@admin.register(Space)
class SpaceAdmin(admin.ModelAdmin):
    list_display = ['name', 'workspace', 'order', 'created_at']
    list_filter = ['workspace']
    search_fields = ['name', 'workspace__name']


@admin.register(Folder)
class FolderAdmin(admin.ModelAdmin):
    list_display = ['name', 'space', 'workspace', 'order', 'created_at']
    list_filter = ['workspace', 'space']
    search_fields = ['name', 'space__name', 'workspace__name']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'workspace', 'space', 'folder', 'owner', 'status', 'created_at']
    list_filter = ['status', 'workspace', 'space']
    search_fields = ['name', 'workspace__name', 'space__name', 'folder__name']


@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ['project', 'user', 'role', 'joined_at']
    list_filter = ['role']
