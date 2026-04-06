from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Task, TaskHistory

@receiver(pre_save, sender=Task)
def track_task_changes(sender, instance, **kwargs):
    if not instance.pk:
        # It's a new task, handle in post_save instead
        return
    
    try:
        old_instance = Task.objects.get(pk=instance.pk)
    except Task.DoesNotExist:
        return

    changes = []
    
    if old_instance.status != instance.status:
        changes.append(f'moved to {instance.get_status_display()}')
    
    if old_instance.priority != instance.priority:
        changes.append(f'changed priority to {instance.get_priority_display()}')
        
    if old_instance.assignee != instance.assignee:
        if instance.assignee:
            changes.append(f'assigned to {instance.assignee.full_name}')
        else:
            changes.append('unassigned')
            
    # Save the changes temporarily on the instance so post_save can access them
    # Note: Because signal kwargs don't easily let us pass the current "user" who made the request,
    # we usually rely on middleware, or we default to the assignee/creator if unavailable.
    # For now, we will store the change strings directly.
    instance._pending_history_changes = changes


@receiver(post_save, sender=Task)
def create_task_history(sender, instance, created, **kwargs):
    # Determine the responsible user (falling back to assignee or creator if request unavailable)
    responsible_user = getattr(instance, '_current_user', instance.assignee or instance.created_by)
    
    if created:
        TaskHistory.objects.create(
            task=instance,
            user=responsible_user,
            action="created this task"
        )
    else:
        changes = getattr(instance, '_pending_history_changes', [])
        for action_str in changes:
            TaskHistory.objects.create(
                task=instance,
                user=responsible_user,
                action=action_str
            )
