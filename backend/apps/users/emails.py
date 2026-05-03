import logging
from concurrent.futures import ThreadPoolExecutor
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

logger = logging.getLogger(__name__)

# Centralized executor for background emails
executor = ThreadPoolExecutor(max_workers=5)

def _send_email_task(subject, plain_body, html_body, recipient):
    try:
        email_message = EmailMultiAlternatives(
            subject=subject,
            body=plain_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient],
        )
        email_message.attach_alternative(html_body, 'text/html')
        email_message.send()
        logger.info(f"Email sent successfully to {recipient}")
    except Exception:
        logger.exception(f'Async email sending failed to {recipient}')

def send_html_email(*, subject, plain_body, html_body, recipient):
    """
    Centralized method to send HTML emails asynchronously.
    """
    executor.submit(_send_email_task, subject, plain_body, html_body, recipient)
