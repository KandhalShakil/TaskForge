from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password, check_password
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer,
)

from datetime import datetime
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


from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=2)

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
    except Exception:
        logger.exception('Async email sending failed')

def _send_html_email(*, subject, plain_body, html_body, recipient):
    executor.submit(_send_email_task, subject, plain_body, html_body, recipient)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payload = serializer.validated_data
            user = create_user(
                email=payload['email'],
                full_name=payload['full_name'],
                password=payload['password'],
                user_type=payload.get('user_type', 'employee'),
            )
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except ServerSelectionTimeoutError:
            return Response(
                {'error': 'Server not responding. Try again later.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception:
            logger.exception('Registration failed')
            return Response(
                {'error': 'Registration failed. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        refresh = RefreshToken.for_user(to_mongo_user(user))
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'message': 'Account created successfully.',
        }, status=status.HTTP_201_CREATED)


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
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_401_UNAUTHORIZED)
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


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def patch(self, request, *args, **kwargs):
        serializer = UserProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        user_id = self.request.user.id
        user_doc = UserDocument.objects(id=user_id).first()
        
        if not user_doc:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        data = serializer.validated_data
        
        if 'full_name' in data:
            user_doc.full_name = data['full_name']
        if 'avatar' in data:
            user_doc.avatar = data['avatar']
        if 'password' in data:
            user_doc.password = make_password(data['password'])
        if 'settings' in data:
            # Merge settings to avoid wiping out other preferences
            current_settings = user_doc.settings or {}
            user_doc.settings = {**current_settings, **data['settings']}
            
        user_doc.updated_at = datetime.utcnow()
        user_doc.save()
        
        return Response(UserSerializer(user_doc).data)


class UserListView(generics.ListAPIView):
    """List all users — used for assigning members."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        # Cache key based on companyId and query params
        company_id = getattr(request.user, 'companyId', 'none')
        cache_key = f"user_list_{company_id}_{request.user.user_type}"
        
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        # Cache for 10 minutes
        cache.set(cache_key, data, timeout=600)
        return Response(data)

    def get_queryset(self):
        user = self.request.user
        # Prevent standard employees from scraping the global user list
        if user.user_type not in ['owner', 'admin'] and not user.is_staff:
            return UserDocument.objects(id=user.id)
            
        # Return only employees from same company, excluding superusers and deleted accounts
        qs = UserDocument.objects(is_active=True, is_deleted=False, companyId=user.companyId, user_type='employee', is_superuser=False)
        
        # Server-side search optimization
        search = self.request.query_params.get('search')
        if search:
            from mongoengine.queryset.visitor import Q
            qs = qs.filter(Q(full_name__icontains=search) | Q(email__icontains=search))
            
        return qs.order_by('full_name').only('id', 'full_name', 'email', 'avatar', 'user_type', 'companyId')


class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        from apps.workspaces.documents import WorkspaceMemberDocument
        from apps.projects.documents import ProjectMemberDocument
        from apps.tasks.documents import TaskDocument, SubTaskDocument
        
        user = request.user
        user_id = str(user.id)
        
        logger.info(f"Account deletion initiated for user ID: {user_id} ({user.email})")
        
        # 1. Remove from Project Memberships
        ProjectMemberDocument.objects(userId=user_id).delete()
        
        # 2. Remove from Workspace Memberships
        WorkspaceMemberDocument.objects(userId=user_id).delete()
        
        # 3. Unassign from Tasks
        TaskDocument.objects(assigneeId=user_id).update(set__assigneeId=None)
        
        # 4. Unassign from Subtasks
        SubTaskDocument.objects(assigneeId=user_id).update(set__assigneeId=None)
        
        # 5. Use atomic update to mark user as deleted and inactive
        updated = UserDocument.objects(id=user_id).update_one(
            set__is_deleted=True,
            set__is_active=False,
            set__updated_at=datetime.utcnow()
        )
        
        if not updated:
            logger.error(f"Failed to update user document for deletion: {user_id}")
            return Response({'error': 'Failed to complete account deletion.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        logger.info(f"Account successfully marked as deleted: {user_id}")
        return Response({'message': 'Account and all associated memberships deleted successfully.'}, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_id = request.user.id
        user_doc = UserDocument.objects(id=user_id).first()
        
        if not check_password(serializer.validated_data['current_password'], user_doc.password):
            return Response({'current_password': ['Invalid current password']}, status=status.HTTP_400_BAD_REQUEST)
            
        user_doc.password = make_password(serializer.validated_data['new_password'])
        user_doc.updated_at = datetime.utcnow()
        user_doc.save()
        
        return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)


class ExportDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.tasks.documents import TaskDocument, CommentDocument
        from apps.projects.documents import ProjectDocument
        
        user = request.user
        user_id = str(user.id)
        
        # Gather user profile
        user_doc = UserDocument.objects(id=user_id).first()
        profile_data = UserSerializer(user_doc).data
        
        # Gather projects owned by user
        projects = ProjectDocument.objects(ownerId=user_id)
        projects_data = [{
            'id': p.id,
            'name': p.name,
            'description': p.description,
            'created_at': p.created_at.isoformat() if p.created_at else None
        } for p in projects]
        
        # Gather tasks created by or assigned to user
        tasks = TaskDocument.objects(createdById=user_id) # or Q(assigneeId=user_id)
        tasks_data = [{
            'id': t.id,
            'title': t.title,
            'status': t.status,
            'priority': t.priority,
            'created_at': t.created_at.isoformat() if t.created_at else None
        } for t in tasks]
        
        # Gather comments
        comments = CommentDocument.objects(authorId=user_id)
        comments_data = [{
            'id': c.id,
            'content': c.content,
            'taskId': c.taskId,
            'created_at': c.created_at.isoformat() if c.created_at else None
        } for c in comments]
        
        export_payload = {
            'profile': profile_data,
            'projects': projects_data,
            'tasks': tasks_data,
            'comments': comments_data,
            'exported_at': datetime.utcnow().isoformat()
        }
        
        return Response(export_payload, status=status.HTTP_200_OK)
