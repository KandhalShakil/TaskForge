import logging
from concurrent.futures import ThreadPoolExecutor
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

logger = logging.getLogger(__name__)

# Centralized executor for background emails
executor = ThreadPoolExecutor(max_workers=10, thread_name_prefix="EmailWorker")

def _send_email_task(subject, plain_body, html_body, recipient):
    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER)
        logger.info(f"Attempting to send email to {recipient} using {settings.EMAIL_HOST}:{settings.EMAIL_PORT} (TLS: {settings.EMAIL_USE_TLS}, SSL: {settings.EMAIL_USE_SSL})")
        
        email_message = EmailMultiAlternatives(
            subject=subject,
            body=plain_body,
            from_email=from_email,
            to=[recipient],
        )
        email_message.attach_alternative(html_body, 'text/html')
        
        # This is a blocking call
        result = email_message.send()
        
        if result:
            logger.info(f"Successfully sent email to {recipient}")
        else:
            logger.error(f"Email sending returned 0 for {recipient} (no emails sent)")
            
    except Exception as e:
        logger.error(f"CRITICAL: Email sending failed for {recipient}. Error: {str(e)}", exc_info=True)

def send_html_email(*, subject, plain_body, html_body, recipient, sync=False):
    """
    Centralized method to send HTML emails.
    """
    if not recipient:
        logger.warning(f"Skipped sending email '{subject}' because recipient is empty.")
        return
        
    if sync:
        logger.info(f"Sending email to {recipient} synchronously...")
        _send_email_task(subject, plain_body, html_body, recipient)
    else:
        logger.debug(f"Queueing email to {recipient}...")
        executor.submit(_send_email_task, subject, plain_body, html_body, recipient)
