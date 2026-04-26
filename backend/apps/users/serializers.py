from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

from .documents import UserDocument
from .mongo_services import create_user


class UserSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    full_name = serializers.CharField()
    avatar = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    user_type = serializers.CharField(read_only=True)
    initials = serializers.SerializerMethodField()
    date_joined = serializers.DateTimeField(read_only=True)
    settings = serializers.DictField(required=False)
    companyId = serializers.CharField(read_only=True)
    company_name = serializers.SerializerMethodField()

    def get_company_name(self, obj):
        if not obj.companyId:
            return None
        from apps.companies.documents import CompanyDocument
        company = CompanyDocument.objects(id=obj.companyId).first()
        return company.name if company else None

    def get_initials(self, obj):
        parts = (getattr(obj, 'full_name', '') or '').split()
        return ''.join(part[0].upper() for part in parts[:2]) if parts else ''


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=255)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    user_type = serializers.ChoiceField(choices=('owner', 'employee'), default='employee')
    company_name = serializers.CharField(max_length=255)

    def validate_user_type(self, value):
        if value == 'admin':
            raise serializers.ValidationError('You cannot register as a system administrator.')
        return value

    def validate_email(self, value):
        normalized = value.lower().strip()
        if UserDocument.objects(email=normalized).first():
            raise serializers.ValidationError('Email already exists')
        return normalized

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        return create_user(**validated_data)




class UserProfileUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(required=False, max_length=255)
    avatar = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    password = serializers.CharField(required=False, write_only=True, validators=[validate_password])
    password2 = serializers.CharField(required=False, write_only=True)
    settings = serializers.DictField(required=False)

    def validate(self, attrs):
        password = attrs.get('password')
        password2 = attrs.get('password2')
        if password and password != password2:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'new_password': 'Passwords do not match.'})
        return attrs
