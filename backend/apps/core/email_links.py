from urllib.parse import urlencode

from django.conf import settings


def get_frontend_base_url():
    raw_url = getattr(settings, 'FRONTEND_URL', '') or ''
    normalized_url = raw_url.strip().rstrip('/')
    if not normalized_url:
        return None

    lowered_url = normalized_url.lower()
    if 'localhost' in lowered_url or '127.0.0.1' in lowered_url or '::1' in lowered_url:
        return None

    return normalized_url


def build_frontend_url(path='', **query_params):
    base_url = get_frontend_base_url()
    if not base_url:
        return None

    normalized_path = f'/{path.lstrip("/")}' if path else ''
    url = f'{base_url}{normalized_path}'

    filtered_query_params = {
        key: value for key, value in query_params.items() if value not in (None, '')
    }
    if filtered_query_params:
        url = f"{url}?{urlencode(filtered_query_params)}"

    return url