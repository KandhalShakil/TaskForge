from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    RegisterSerializer,
    UserSerializer,
)

from django.template.loader import render_to_string
from django.core.cache import cache
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
import random
import logging

from pymongo.errors import ServerSelectionTimeoutError

from .documents import UserDocument
from .mongo_services import authenticate_user, create_user, to_mongo_user, update_password


logger = logging.getLogger(__name__)


def _send_html_email(*, subject, plain_body, html_body, recipient):
    email_message = EmailMultiAlternatives(
        subject=subject,
        body=plain_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[recipient],
    )
    email_message.attach_alternative(html_body, 'text/html')
    email_message.send()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = RegisterSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            email = serializer.validated_data.get('email')
            otp = str(random.randint(100000, 999999))

            # Store registration data and OTP in cache
            cache_key = f"register_data_{email}"
            cache_data = {
                'data': serializer.validated_data,
                'otp': otp,
            }
            cache.set(cache_key, cache_data, timeout=settings.OTP_EXPIRY)

            # Send OTP via email
            html_message = render_to_string('emails/otp_email.html', {'otp': otp})
            plain_message = f'Your verification code is: {otp}. It will expire in 15 minutes.'

            _send_html_email(
                subject='Verify your TaskForge account',
                plain_body=plain_message,
                html_body=html_message,
                recipient=email,
            )
        except ServerSelectionTimeoutError:
            return Response(
                {'error': 'Server not responding. Try again later.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception:
            logger.exception('Registration request failed')
            return Response(
                {'error': 'Failed to send verification email. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        return Response({
            'message': 'OTP sent successfully. Please verify your email.',
            'email': email
        }, status=status.HTTP_200_OK)


class VerifyRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({'error': 'Email and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        cache_key = f"register_data_{email}"
        cache_data = cache.get(cache_key)
        
        if not cache_data:
            return Response({'error': 'Registration session expired or invalid.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if cache_data['otp'] != str(otp):
            return Response({'error': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # OTP is valid, create the user
        try:
            payload = cache_data['data']
            user = create_user(
                email=payload['email'],
                full_name=payload['full_name'],
                password=payload['password'],
                user_type=payload.get('user_type', 'employee'),
            )
            
            # Clear cache
            cache.delete(cache_key)
            
            # Generate tokens
            refresh = RefreshToken.for_user(to_mongo_user(user))
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'message': 'Account verified and created successfully.'
            }, status=status.HTTP_201_CREATED)
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            logger.exception('Unexpected error while creating user during registration verification')
            return Response({'error': 'Something went wrong'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        cache_key = f"register_data_{email}"
        cache_data = cache.get(cache_key)
        
        if not cache_data:
            return Response({'error': 'No pending registration found for this email.'}, status=status.HTTP_400_BAD_REQUEST)
            
        otp = str(random.randint(100000, 999999))
        cache_data['otp'] = otp
        cache.set(cache_key, cache_data, timeout=settings.OTP_EXPIRY)
        
        try:
            html_message = render_to_string('emails/otp_email.html', {'otp': otp})
            plain_message = f'Your new verification code is: {otp}. It will expire in 15 minutes.'

            _send_html_email(
                subject='Your new TaskForge verification code',
                plain_body=plain_message,
                html_body=html_message,
                recipient=email,
            )
            return Response({'message': 'New OTP sent successfully.'}, status=status.HTTP_200_OK)
        except Exception:
            logger.exception('Failed to resend verification email')
            return Response({'error': 'Failed to send email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Do not reveal if user exists to prevent account enumeration
        user = UserDocument.objects(email=email.lower().strip()).first()
        if user:
            otp = str(random.randint(100000, 999999))
            cache_key = f"forgot_password_{email}"
            cache.set(cache_key, {'otp': otp}, timeout=settings.OTP_EXPIRY)

            try:
                html_message = render_to_string('emails/otp_email.html', {'otp': otp})
                plain_message = f'Your password reset code is: {otp}. It will expire in 15 minutes.'
                _send_html_email(
                    subject='TaskForge password reset code',
                    plain_body=plain_message,
                    html_body=html_message,
                    recipient=email,
                )
            except Exception:
                logger.exception('Failed to send password reset email')
                return Response(
                    {'error': 'Failed to send reset email. Please try again.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(
            {'message': 'If this email exists, a reset code has been sent.'},
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = str(request.data.get('otp', ''))
        password = request.data.get('password')
        password2 = request.data.get('password2')

        if not email or not otp or not password or not password2:
            return Response(
                {'error': 'Email, otp, password and password2 are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if password != password2:
            return Response({'error': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(password)
        except Exception as exc:
            return Response({'error': exc.messages if hasattr(exc, 'messages') else str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        cache_key = f"forgot_password_{email}"
        cache_data = cache.get(cache_key)
        if not cache_data or cache_data.get('otp') != otp:
            return Response({'error': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        user = UserDocument.objects(email=email.lower().strip()).first()
        if not user:
            return Response({'error': 'Invalid request.'}, status=status.HTTP_400_BAD_REQUEST)

        update_password(user=user, raw_password=password)
        cache.delete(cache_key)

        return Response({'message': 'Password reset successful.'}, status=status.HTTP_200_OK)


class CustomTokenObtainPairView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '')
        password = request.data.get('password', '')

        try:
            user_doc = authenticate_user(email=email, password=password)
        except ServerSelectionTimeoutError:
            return Response(
                {'error': 'Server not responding. Try again later.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if not user_doc:
            return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

        user = to_mongo_user(user_doc)
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user_doc).data,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


class MeView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    """List all users — used for assigning members."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Prevent standard employees from scraping the global user list
        if self.request.user.user_type not in ['company', 'admin'] and not self.request.user.is_staff:
            return UserDocument.objects(id=self.request.user.id)
            
        # Return only employees, excluding superusers
        return UserDocument.objects(is_active=True, user_type='employee', is_superuser=False)
