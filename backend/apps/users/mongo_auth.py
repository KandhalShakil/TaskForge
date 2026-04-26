from dataclasses import dataclass

from rest_framework import exceptions
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.settings import api_settings

from .documents import UserDocument


@dataclass
class MongoUser:
    id: str
    email: str
    full_name: str
    user_type: str
    is_active: bool
    is_staff: bool
    is_superuser: bool
    companyId: str | None = None
    avatar: str | None = None

    @property
    def is_authenticated(self):
        return True

    @property
    def pk(self):
        return self.id

    @property
    def initials(self):
        parts = (self.full_name or '').split()
        return ''.join(part[0].upper() for part in parts[:2]) if parts else ''


class MongoJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError as exc:
            raise exceptions.AuthenticationFailed('Token contained no recognizable user identification') from exc

        user = UserDocument.objects(id=str(user_id)).first()
        if not user or not user.is_active:
            raise exceptions.AuthenticationFailed('User not found or inactive')

        return MongoUser(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            user_type=user.user_type,
            is_active=user.is_active,
            is_staff=user.is_staff,
            is_superuser=user.is_superuser,
            companyId=getattr(user, 'companyId', None),
            avatar=user.avatar,
        )
