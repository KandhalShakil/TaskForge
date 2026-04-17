from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0008_subtask_detail_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='subtask',
            name='description',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='subtask',
            name='category',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='subtasks', to='tasks.category'),
        ),
    ]