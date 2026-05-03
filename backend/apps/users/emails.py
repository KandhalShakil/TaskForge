import logging
import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from django.conf import settings

logger = logging.getLogger(__name__)

# Centralized executor for background emails
executor = ThreadPoolExecutor(max_workers=10, thread_name_prefix="EmailWorker")

def _send_email_task(subject, plain_body, html_body, recipient):
    """
    Sends email via EmailJS REST API using centralized credentials.
    """
    url = "https://api.emailjs.com/api/v1.0/email/send"
    
    # EmailJS Configuration from settings
    service_id = settings.EMAILJS_SERVICE_ID
    template_id = settings.EMAILJS_TEMPLATE_ID
    public_key = settings.EMAILJS_PUBLIC_KEY
    # private_key = settings.EMAILJS_PRIVATE_KEY
    
    if not all([service_id, template_id, public_key]):
        logger.error("EmailJS: Configuration missing (service_id, template_id, or public_key). Check .env file.")
        return

    data = {
    "service_id": service_id,
    "template_id": template_id,
    "public_key": public_key,
    "template_params": {
        "subject": subject,
        "to_email": recipient,
        "from_name": "TaskForge",
        "HTML_CODE": html_body
    }
}
    
    headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
    }
    
    try:
        logger.info(f"EmailJS: Attempting to send '{subject}' to {recipient}...")
        
        req = urllib.request.Request(
            url, 
            data=json.dumps(data).encode('utf-8'), 
            headers=headers, 
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=20) as response:
            status = response.getcode()
            res_body = response.read().decode('utf-8')
            
            if status == 200:
                logger.info(f"EmailJS: Successfully sent email to {recipient}")
            else:
                logger.error(f"EmailJS Error: Received status {status}. Response: {res_body}")
                
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        logger.error(f"EmailJS HTTP Error {e.code}: {error_body}")
    except Exception as e:
        logger.error(f"EmailJS CRITICAL Error for {recipient}: {str(e)}", exc_info=True)

def send_html_email(*, subject, plain_body, html_body, recipient, sync=False):
    """
    Unified method to send emails across the application lifecycle.
    Supported: Registration, Deletion, Task Reminders, Account Recovery, Password Reset.
    """
    if not recipient:
        logger.warning(f"Skipped sending email '{subject}' because recipient is empty.")
        return
        
    if sync:
        logger.info(f"Sending email to {recipient} synchronously via EmailJS...")
        _send_email_task(subject, plain_body, html_body, recipient)
    else:
        logger.debug(f"Queueing email to {recipient} via EmailJS...")
        executor.submit(_send_email_task, subject, plain_body, html_body, recipient)
