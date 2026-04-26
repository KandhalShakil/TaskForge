from django.core.management.base import BaseCommand
from apps.core.mongo import ensure_indexes


class Command(BaseCommand):
    help = 'Create required MongoDB indexes for migrated collections'

    def handle(self, *args, **options):
           ensure_indexes()

           from apps.core.mongo import get_mongo_db

           db = get_mongo_db()
           db.workspaces.create_index([('ownerId', 1)], name='workspaces_owner_idx')
           db.workspace_members.create_index([('workspaceId', 1), ('userId', 1)], unique=True, name='workspace_members_unique_idx')
           db.spaces.create_index([('workspaceId', 1), ('order', 1)], name='spaces_workspace_order_idx')
           db.folders.create_index([('workspaceId', 1), ('spaceId', 1), ('order', 1)], name='folders_workspace_space_order_idx')
           db.projects.create_index([('workspaceId', 1), ('spaceId', 1), ('folderId', 1), ('status', 1)], name='projects_hierarchy_status_idx')
           db.project_members.create_index([('projectId', 1), ('userId', 1)], unique=True, name='project_members_unique_idx')
           db.categories.create_index([('workspaceId', 1), ('name', 1)], unique=True, name='categories_workspace_name_unique_idx')
           db.tasks.create_index([('workspaceId', 1), ('projectId', 1), ('parentTaskId', 1)], name='tasks_hierarchy_idx')
           db.tasks.create_index([('assigneeId', 1), ('due_date', 1)], name='tasks_assignee_due_idx')
           db.task_comments.create_index([('taskId', 1), ('created_at', 1)], name='task_comments_task_created_idx')
           db.subtasks.create_index([('taskId', 1), ('parentId', 1), ('order', 1)], name='subtasks_hierarchy_order_idx')
           
           # Additional Optimization Indexes
           db.users.create_index([('companyId', 1)], name='users_company_idx')
           db.workspaces.create_index([('companyId', 1)], name='workspaces_company_idx')
           db.chat_messages.create_index([('roomId', 1), ('senderId', 1)], name='chat_room_sender_idx')
           db.tasks.create_index([('workspaceId', 1), ('status', 1), ('priority', 1)], name='tasks_perf_idx')

           self.stdout.write(self.style.SUCCESS('MongoDB indexes ensured successfully.'))
