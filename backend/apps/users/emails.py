import logging
import requests
from concurrent.futures import ThreadPoolExecutor
from django.conf import settings

logger = logging.getLogger(__name__)

# Centralized executor for background emails
executor = ThreadPoolExecutor(max_workers=10, thread_name_prefix="EmailWorker")

def send_email(subject, to_email, html_content):
    """
    Sends email via Brevo (Sendinblue) API v3.
    """
    url = "https://api.brevo.com/v3/smtp/email"
    
    api_key = getattr(settings, 'BREVO_API_KEY', None)
    if not api_key:
        logger.error("Brevo API: Configuration missing (BREVO_API_KEY). Check settings.")
        return False

    payload = {
        "sender": {
            "name": settings.DEFAULT_FROM_NAME,
            "email": settings.DEFAULT_FROM_EMAIL
        },
        "to": [
            {
                "email": to_email
            }
        ],
        "subject": subject,
        "htmlContent": html_content
    }
    
    headers = {
        "api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    try:
        logger.info(f"Brevo API: Attempting to send '{subject}' to {to_email}...")
        
        response = requests.post(url, json=payload, headers=headers, timeout=20)
        
        if response.status_code in [200, 201, 202]:
            logger.info(f"Brevo API: Successfully sent email to {to_email}. Message ID: {response.json().get('messageId')}")
            return True
        else:
            logger.error(f"Brevo API Error: Received status {response.status_code}. Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Brevo API Connection Error for {to_email}: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Brevo API CRITICAL Error for {to_email}: {str(e)}", exc_info=True)
        return False

def send_html_email(*, subject, plain_body, html_body, recipient, sync=False):
    """
    Unified method to send emails across the application lifecycle.
    Supported: Registration, Deletion, Task Reminders, Account Recovery, Password Reset.
    """
    if not recipient:
        logger.warning(f"Skipped sending email '{subject}' because recipient is empty.")
        return
        
    if sync:
        logger.info(f"Sending email to {recipient} synchronously via Brevo API...")
        send_email(subject, recipient, html_body)
    else:
        logger.debug(f"Queueing email to {recipient} via Brevo API...")
        executor.submit(send_email, subject, recipient, html_body)
