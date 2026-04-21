from .base import *

DEBUG = False

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_TRUSTED_ORIGINS = [
    "https://www.task-forge.kandhal.tech",
    "https://task-forge.kandhal.tech",
    "https://taskforge-backend-hgre.onrender.com",
]

# Allow requests from both the custom domain and vercel preview URLs.
# CORS is also controlled by CORS_ALLOWED_ORIGINS in .env on Render —
# this list acts as a fallback when that env var is not set.
CORS_ALLOWED_ORIGINS = [
    "https://www.task-forge.kandhal.tech",
    "https://task-forge.kandhal.tech",
]

# Allow any *.vercel.app subdomain (for preview deployments)
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
]
