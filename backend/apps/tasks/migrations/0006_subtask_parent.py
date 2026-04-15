from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0005_subtask"),
    ]

    operations = [
        migrations.AddField(
            model_name="subtask",
            name="parent",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="children",
                to="tasks.subtask",
            ),
        ),
        migrations.AlterModelOptions(
            name="subtask",
            options={"db_table": "subtasks", "ordering": ["order", "created_at"]},
        ),
        migrations.AddIndex(
            model_name="subtask",
            index=models.Index(fields=["task", "parent", "order"], name="subtasks_task_parent_order_idx"),
        ),
    ]
