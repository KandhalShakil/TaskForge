import time
import logging
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.conf import settings
from django.template.loader import render_to_string
from apps.users.documents import UserDocument
from apps.tasks.documents import TaskDocument, SubTaskDocument
from apps.users.emails import send_html_email

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Runs background tasks for email reminders and account deletion'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Background worker started...'))
        
        while True:
            try:
                self.process_deadline_reminders()
                self.process_deletion_reminders()
                self.process_permanent_deletions()
                
                # Check every 5 minutes
                time.sleep(300)
            except KeyboardInterrupt:
                self.stdout.write(self.style.WARNING('Worker stopped by user.'))
                break
            except Exception as e:
                logger.exception("Error in background worker loop")
                time.sleep(60)

    def process_deadline_reminders(self):
        self.stdout.write('Checking for task deadlines...')
        now = datetime.utcnow()
        # Near deadline defined as within 24 hours
        deadline_window = now + timedelta(hours=24)
        
        # 1. Main Tasks
        tasks = TaskDocument.objects(
            due_date__lte=deadline_window,
            due_date__gt=now,
            status__ne='done',
            reminder_sent=False,
            assigneeId__ne=""
        )
        
        for task in tasks:
            user = UserDocument.objects(id=task.assigneeId).first()
            if user and user.email:
                self.send_task_reminder(user, task)
                task.update(set__reminder_sent=True)
                self.stdout.write(f'Sent deadline reminder for task: {task.title} to {user.email}')

        # 2. Subtasks
        subtasks = SubTaskDocument.objects(
            due_date__lte=deadline_window,
            due_date__gt=now,
            status__ne='done',
            reminder_sent=False,
            assigneeId__ne=""
        )
        
        for st in subtasks:
            user = UserDocument.objects(id=st.assigneeId).first()
            if user and user.email:
                self.send_task_reminder(user, st)
                st.update(set__reminder_sent=True)
                self.stdout.write(f'Sent deadline reminder for subtask: {st.title} to {user.email}')

    def send_task_reminder(self, user, task):
        try:
            html_message = render_to_string('emails/task_reminder.html', {
                'task_title': task.title,
                'deadline': task.due_date.strftime('%B %d, %Y at %I:%M %p'),
                'dashboard_url': f"{settings.FRONTEND_URL}/dashboard"
            })
            plain_message = f"Reminder: Your task '{task.title}' is due on {task.due_date}."
            
            send_html_email(
                subject=f"Deadline Reminder: {task.title}",
                plain_body=plain_message,
                html_body=html_message,
                recipient=user.email
            )
        except Exception:
            logger.exception(f"Failed to send task reminder to {user.email}")

    def process_deletion_reminders(self):
        self.stdout.write('Checking for deletion reminders...')
        now = datetime.utcnow()
        
        # 1. 10-Day Reminder (now - deleted_at >= 10 days)
        limit_10d = now - timedelta(days=10)
        users_10d = UserDocument.objects(
            is_deleted=True,
            deleted_at__lte=limit_10d,
            reminder_10_day_sent=False
        )
        for user in users_10d:
            self.send_deletion_reminder(user, "10-day")
            user.update(set__reminder_10_day_sent=True)
            self.stdout.write(f'Sent 10-day deletion reminder to {user.email}')

        # 2. Final Warning (1 hour before 15 days: 14 days and 23 hours)
        limit_final = now - timedelta(days=14, hours=23)
        users_final = UserDocument.objects(
            is_deleted=True,
            deleted_at__lte=limit_final,
            final_warning_sent=False
        )
        for user in users_final:
            self.send_deletion_reminder(user, "final")
            user.update(set__final_warning_sent=True)
            self.stdout.write(f'Sent final deletion warning to {user.email}')

    def send_deletion_reminder(self, user, type):
        try:
            recovery_url = f"{settings.FRONTEND_URL}/recover-account?token={user.recovery_token}"
            if type == "10-day":
                subject = "Account Deletion Reminder"
                template = 'emails/deletion_reminder.html'
                plain_message = "Your account will be permanently deleted in 5 days. Recover your account if needed."
                context = {
                    'days_remaining': 5,
                    'recovery_url': recovery_url
                }
            else: # final warning
                subject = "Final Warning: Account Deletion"
                template = 'emails/final_warning.html'
                plain_message = "Your account will be permanently deleted in 1 hour. Recover now to avoid data loss."
                context = {
                    'recovery_url': recovery_url
                }

            html_message = render_to_string(template, context)
            
            send_html_email(
                subject=subject,
                plain_body=plain_message,
                html_body=html_message,
                recipient=user.email
            )
        except Exception:
            logger.exception(f"Failed to send {type} deletion reminder to {user.email}")

    def process_permanent_deletions(self):
        self.stdout.write('Checking for permanent deletions...')
        # Permanent deletion after 15 days
        limit = datetime.utcnow() - timedelta(days=15)
        
        users_to_delete = UserDocument.objects(
            is_deleted=True,
            deleted_at__lte=limit
        )
        
        for user in users_to_delete:
            user_id = str(user.id)
            self.stdout.write(f'Permanently deleting user data for: {user.email}')
            
            from apps.workspaces.documents import WorkspaceMemberDocument
            from apps.projects.documents import ProjectMemberDocument
            from apps.tasks.documents import TaskDocument, SubTaskDocument
            from apps.chat.documents import MessageDocument
            
            # 1. Memberships
            ProjectMemberDocument.objects(userId=user_id).delete()
            WorkspaceMemberDocument.objects(userId=user_id).delete()
            
            # 2. Unassign tasks/subtasks
            TaskDocument.objects(assigneeId=user_id).update(set__assigneeId="")
            SubTaskDocument.objects(assigneeId=user_id).update(set__assigneeId="")
            
            # 3. Clean up other personal data if necessary (e.g. chat messages stay but maybe anonymize?)
            # For now, following the user's "permanently delete user data" instruction
            
            # Finally delete the user document
            user.delete()
            self.stdout.write(f'User {user_id} permanently removed.')
