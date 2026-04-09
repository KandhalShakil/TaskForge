from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    initials = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'avatar', 'user_type', 'initials', 'date_joined']
        read_only_fields = ['id', 'date_joined', 'user_type']

    def get_initials(self, obj):
        return obj.initials


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'full_name', 'password', 'password2', 'user_type']

    def validate_user_type(self, value):
        if value == User.UserType.ADMIN:
            raise serializers.ValidationError('You cannot register as a system administrator.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data



