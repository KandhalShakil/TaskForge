import os
import django
from django.core.mail import send_mail
from django.conf import settings
from decouple import config

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

def test_email():
    print("Attempting to send test email...")
    print(f"HOST: {settings.EMAIL_HOST}")
    print(f"PORT: {settings.EMAIL_PORT}")
    print(f"USER: {settings.EMAIL_HOST_USER}")
    
    try:
        send_mail(
            subject='TaskForge Email Test',
            message='This is a test email from the TaskForge environment.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.EMAIL_HOST_USER], # send to self
            fail_silently=False,
        )
        print("Success! Email sent successfully.")
    except Exception as e:
        print(f"ERROR: Failed to send email. {str(e)}")

if __name__ == "__main__":
    test_email()
