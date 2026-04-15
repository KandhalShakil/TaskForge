from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0007_rename_subtasks_task_parent_order_idx_subtasks_task_id_491407_idx"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="subtask",
            name="assignee",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="assigned_subtasks",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="subtask",
            name="due_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="subtask",
            name="estimated_hours",
            field=models.DecimalField(blank=True, decimal_places=1, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name="subtask",
            name="priority",
            field=models.CharField(
                choices=[
                    ("urgent", "Urgent"),
                    ("high", "High"),
                    ("medium", "Medium"),
                    ("low", "Low"),
                    ("no_priority", "No Priority"),
                ],
                default="no_priority",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="subtask",
            name="start_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="subtask",
            name="status",
            field=models.CharField(
                choices=[
                    ("todo", "To Do"),
                    ("in_progress", "In Progress"),
                    ("in_review", "In Review"),
                    ("done", "Done"),
                    ("cancelled", "Cancelled"),
                ],
                default="todo",
                max_length=20,
            ),
        ),
    ]
