#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.tasks.documents import TaskDocument
from apps.projects.documents import ProjectDocument

tasks = TaskDocument.objects()
print(f"\n📊 Total tasks in database: {tasks.count()}")

if tasks.count() == 0:
    print("❌ No tasks found in the database.")
    print("\n📁 Checking projects...")
    projects = ProjectDocument.objects()
    print(f"Total projects: {projects.count()}")
    for proj in projects:
        print(f"  - {proj.id}: {proj.name} (workspace: {proj.workspaceId})")
else:
    print("\n✅ Tasks found:")
    for task in tasks:
        print(f"  - ID: {task.id}")
        print(f"    Title: {task.title}")
        print(f"    Project: {task.projectId}")
        print(f"    Workspace: {task.workspaceId}")
        print()
