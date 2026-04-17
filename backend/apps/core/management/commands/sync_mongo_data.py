from django.core.management.base import BaseCommand

from apps.core.mongo import ensure_indexes
from apps.core.mongo_sync import upsert_document
from apps.projects.models import Folder, Project, ProjectMember, Space
from apps.tasks.models import Category, Comment, SubTask, Task
from apps.users.models import User
from apps.workspaces.models import Workspace, WorkspaceMember


class Command(BaseCommand):
    help = 'Backfill MongoDB cluster with the current Django data.'

    def handle(self, *args, **options):
        ensure_indexes()

        counts = {
            'users': 0,
            'workspaces': 0,
            'workspace_members': 0,
            'spaces': 0,
            'folders': 0,
            'projects': 0,
            'project_members': 0,
            'categories': 0,
            'tasks': 0,
            'task_comments': 0,
            'subtasks': 0,
        }

        for user in User.objects.all().iterator():
            upsert_document('users', {
                '_id': str(user.id),
                'email': user.email,
                'full_name': user.full_name,
                'avatar': user.avatar.url if user.avatar else None,
                'user_type': user.user_type,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'date_joined': user.date_joined,
                'updated_at': user.updated_at,
            })
            counts['users'] += 1

        for workspace in Workspace.objects.select_related('owner').all().iterator():
            upsert_document('workspaces', {
                '_id': str(workspace.id),
                'name': workspace.name,
                'description': workspace.description,
                'icon': workspace.icon,
                'color': workspace.color,
                'ownerId': str(workspace.owner_id) if workspace.owner_id else None,
                'created_at': workspace.created_at,
                'updated_at': workspace.updated_at,
            })
            counts['workspaces'] += 1

        for member in WorkspaceMember.objects.select_related('workspace', 'user').all().iterator():
            upsert_document('workspace_members', {
                '_id': str(member.id),
                'workspaceId': str(member.workspace_id),
                'userId': str(member.user_id),
                'role': member.role,
                'status': member.status,
                'joined_at': member.joined_at,
            })
            counts['workspace_members'] += 1

        for space in Space.objects.select_related('workspace', 'created_by').all().iterator():
            upsert_document('spaces', {
                '_id': str(space.id),
                'workspaceId': str(space.workspace_id),
                'name': space.name,
                'description': space.description,
                'icon': space.icon,
                'color': space.color,
                'order': space.order,
                'createdById': str(space.created_by_id) if space.created_by_id else None,
                'created_at': space.created_at,
                'updated_at': space.updated_at,
            })
            counts['spaces'] += 1

        for folder in Folder.objects.select_related('workspace', 'space', 'created_by').all().iterator():
            upsert_document('folders', {
                '_id': str(folder.id),
                'workspaceId': str(folder.workspace_id),
                'spaceId': str(folder.space_id),
                'name': folder.name,
                'description': folder.description,
                'icon': folder.icon,
                'color': folder.color,
                'order': folder.order,
                'createdById': str(folder.created_by_id) if folder.created_by_id else None,
                'created_at': folder.created_at,
                'updated_at': folder.updated_at,
            })
            counts['folders'] += 1

        for project in Project.objects.select_related('workspace', 'space', 'folder', 'owner').all().iterator():
            upsert_document('projects', {
                '_id': str(project.id),
                'workspaceId': str(project.workspace_id),
                'spaceId': str(project.space_id) if project.space_id else None,
                'folderId': str(project.folder_id) if project.folder_id else None,
                'name': project.name,
                'description': project.description,
                'icon': project.icon,
                'color': project.color,
                'status': project.status,
                'ownerId': str(project.owner_id) if project.owner_id else None,
                'start_date': project.start_date,
                'end_date': project.end_date,
                'order': project.order,
                'created_at': project.created_at,
                'updated_at': project.updated_at,
            })
            counts['projects'] += 1

        for member in ProjectMember.objects.select_related('project', 'user').all().iterator():
            upsert_document('project_members', {
                '_id': str(member.id),
                'projectId': str(member.project_id),
                'userId': str(member.user_id),
                'role': member.role,
                'joined_at': member.joined_at,
            })
            counts['project_members'] += 1

        for category in Category.objects.select_related('workspace').all().iterator():
            upsert_document('categories', {
                '_id': str(category.id),
                'workspaceId': str(category.workspace_id),
                'name': category.name,
                'color': category.color,
                'created_at': category.created_at,
            })
            counts['categories'] += 1

        for task in Task.objects.select_related('workspace', 'project', 'category', 'assignee', 'created_by').all().iterator():
            upsert_document('tasks', {
                '_id': str(task.id),
                'workspaceId': str(task.workspace_id),
                'projectId': str(task.project_id) if task.project_id else None,
                'title': task.title,
                'description': task.description,
                'status': task.status,
                'priority': task.priority,
                'categoryId': str(task.category_id) if task.category_id else None,
                'assigneeId': str(task.assignee_id) if task.assignee_id else None,
                'createdById': str(task.created_by_id) if task.created_by_id else None,
                'due_date': task.due_date,
                'start_date': task.start_date,
                'estimated_hours': task.estimated_hours,
                'order': task.order,
                'created_at': task.created_at,
                'updated_at': task.updated_at,
            })
            counts['tasks'] += 1

        for comment in Comment.objects.select_related('task', 'author').all().iterator():
            upsert_document('task_comments', {
                '_id': str(comment.id),
                'taskId': str(comment.task_id),
                'authorId': str(comment.author_id),
                'content': comment.content,
                'created_at': comment.created_at,
                'updated_at': comment.updated_at,
            })
            counts['task_comments'] += 1

        for subtask in SubTask.objects.select_related('task', 'parent', 'category', 'assignee').all().iterator():
            upsert_document('subtasks', {
                '_id': str(subtask.id),
                'taskId': str(subtask.task_id),
                'parentId': str(subtask.parent_id) if subtask.parent_id else None,
                'title': subtask.title,
                'description': subtask.description,
                'status': subtask.status,
                'priority': subtask.priority,
                'categoryId': str(subtask.category_id) if subtask.category_id else None,
                'assigneeId': str(subtask.assignee_id) if subtask.assignee_id else None,
                'start_date': subtask.start_date,
                'due_date': subtask.due_date,
                'estimated_hours': subtask.estimated_hours,
                'is_completed': subtask.is_completed,
                'order': subtask.order,
                'created_at': subtask.created_at,
                'updated_at': subtask.updated_at,
            })
            counts['subtasks'] += 1

        for collection, count in counts.items():
            self.stdout.write(self.style.SUCCESS(f'{collection}: {count} records synced'))
