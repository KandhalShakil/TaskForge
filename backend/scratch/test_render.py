import os
import django
from django.template.loader import render_to_string
from django.conf import settings
from decouple import config

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

def test_render():
    print("Testing template rendering...")
    try:
        context = {
            'deletion_date': 'May 18, 2026',
            'recovery_url': 'http://localhost:5173/recover'
        }
        html = render_to_string('emails/deletion_initiated.html', context)
        print("Success! Template rendered.")
        print("Preview (first 100 chars):")
        print(html[:100])
    except Exception as e:
        print(f"ERROR: Failed to render template. {str(e)}")

if __name__ == "__main__":
    test_render()
