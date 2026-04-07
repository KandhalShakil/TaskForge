from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Task

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
            
    # Save the changes temporarily on the instance
    instance._pending_changes = changes


@receiver(post_save, sender=Task)
def task_post_save(sender, instance, created, **kwargs):
    # This signal currently does nothing since TaskHistory was removed, 
    # but we keep it here for future hooks like notifications.
    pass
