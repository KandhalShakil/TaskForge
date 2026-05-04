import logging
from concurrent.futures import ThreadPoolExecutor
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)

# Centralized executor for background emails
executor = ThreadPoolExecutor(max_workers=10, thread_name_prefix="EmailWorker")

def _send_email_task(subject, plain_body, html_body, recipient):
    """
    Sends email via Django's SMTP backend.
    """
    try:
        logger.info(f"SMTP: Attempting to send '{subject}' to {recipient}...")
        
        email = EmailMultiAlternatives(
            subject=subject,
            body=plain_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient],
        )
        email.attach_alternative(html_body, "text/html")
        
        email.send(fail_silently=False)
        logger.info(f"SMTP: Successfully sent email to {recipient}")
        
    except Exception as e:
        logger.error(f"SMTP CRITICAL Error for {recipient}: {str(e)}", exc_info=True)

def send_html_email(*, subject, plain_body, html_body, recipient, sync=False):
    """
    Unified method to send emails across the application lifecycle.
    Supported: Registration, Deletion, Task Reminders, Account Recovery, Password Reset.
    """
    if not recipient:
        logger.warning(f"Skipped sending email '{subject}' because recipient is empty.")
        return
        
    if sync:
        logger.info(f"Sending email to {recipient} synchronously via SMTP...")
        _send_email_task(subject, plain_body, html_body, recipient)
    else:
        logger.debug(f"Queueing email to {recipient} via SMTP...")
        executor.submit(_send_email_task, subject, plain_body, html_body, recipient)
