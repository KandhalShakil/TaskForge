import logging

from django.core.exceptions import PermissionDenied, SuspiciousOperation
from django.http import Http404, JsonResponse
from pymongo.errors import DuplicateKeyError, ServerSelectionTimeoutError


logger = logging.getLogger(__name__)


class ApiJsonErrorMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        is_api_request = request.path.startswith('/api/')

        try:
            response = self.get_response(request)
        except Http404:
            if is_api_request:
                return JsonResponse({'error': 'Not found.'}, status=404)
            raise
        except PermissionDenied:
            if is_api_request:
                return JsonResponse({'error': 'Permission denied.'}, status=403)
            raise
        except SuspiciousOperation:
            if is_api_request:
                return JsonResponse({'error': 'Bad request.'}, status=400)
            raise
        except DuplicateKeyError:
            if is_api_request:
                return JsonResponse({'error': 'Email already exists'}, status=400)
            raise
        except ServerSelectionTimeoutError:
            if is_api_request:
                return JsonResponse({'error': 'Server not responding. Try again later.'}, status=503)
            raise
        except Exception:
            logger.exception('Unhandled exception during request processing')
            if is_api_request:
                return JsonResponse({'error': 'Server error. Please try again.'}, status=500)
            raise

        if not is_api_request:
            return response

        content_type = response.get('Content-Type', '')
        if response.status_code >= 400 and 'text/html' in content_type:
            message = 'Server error. Please try again.'
            if response.status_code == 400:
                message = 'Bad request.'
            elif response.status_code == 401:
                message = 'Unauthorized.'
            elif response.status_code == 403:
                message = 'Permission denied.'
            elif response.status_code == 404:
                message = 'Not found.'
            elif response.status_code == 405:
                message = 'Method not allowed.'
            return JsonResponse({'error': message}, status=response.status_code)

        return response