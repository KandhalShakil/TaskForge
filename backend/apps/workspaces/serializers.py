import uuid

from rest_framework import serializers

from apps.users.documents import UserDocument
from apps.users.serializers import UserSerializer
from .documents import WorkspaceDocument, WorkspaceMemberDocument

class WorkspaceSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    icon = serializers.CharField(required=False, allow_blank=True)
    color = serializers.CharField(required=False, allow_blank=True)
    owner = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError('Name is required.')
        return value.strip()

    def create(self, validated_data):
        user = self.context['request'].user
        workspace = WorkspaceDocument(
            id=validated_data.get('id') or str(uuid.uuid4()),
            name=validated_data['name'],
            description=validated_data.get('description', ''),
            icon=validated_data.get('icon', '🚀'),
            color=validated_data.get('color', '#6366f1'),
            ownerId=str(user.id),
        )
        workspace.save()

        WorkspaceMemberDocument(
            id=str(uuid.uuid4()),
            workspaceId=str(workspace.id),
            userId=str(user.id),
            role='admin',
            status='accepted',
        ).save()

        return workspace

    def update(self, instance, validated_data):
        for key in ('name', 'description', 'icon', 'color'):
            if key in validated_data:
                setattr(instance, key, validated_data[key])
        instance.save()
        return instance

    def get_owner(self, obj):
        owner = UserDocument.objects(id=str(getattr(obj, 'ownerId', ''))).first()
        return UserSerializer(owner).data if owner else None

    def get_member_count(self, obj):
        return WorkspaceMemberDocument.objects(workspaceId=str(obj.id), status='accepted').count()

    def get_user_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            member = WorkspaceMemberDocument.objects(
                workspaceId=str(obj.id),
                userId=str(request.user.id),
            ).first()
            return member.role if member else None
        return None


class WorkspaceMemberSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    user = serializers.SerializerMethodField()
    user_id = serializers.CharField(write_only=True, required=False)
    workspace = serializers.SerializerMethodField()
    role = serializers.ChoiceField(choices=('admin', 'member', 'viewer'), required=False, default='member')
    status = serializers.CharField(read_only=True)
    joined_at = serializers.DateTimeField(read_only=True)

    def get_user(self, obj):
        user = UserDocument.objects(id=str(getattr(obj, 'userId', ''))).first()
        return UserSerializer(user).data if user else None

    def get_workspace(self, obj):
        workspace = WorkspaceDocument.objects(id=str(getattr(obj, 'workspaceId', ''))).first()
        if not workspace:
            return None
        return WorkspaceSerializer(workspace, context=self.context).data

    def validate_user_id(self, value):
        if not UserDocument.objects(id=str(value), is_active=True).first():
            raise serializers.ValidationError('User not found.')
        return value


class WorkspaceDetailSerializer(WorkspaceSerializer):
    members = serializers.SerializerMethodField()

    def get_members(self, obj):
        members = WorkspaceMemberDocument.objects(workspaceId=str(obj.id))
        return WorkspaceMemberSerializer(members, many=True, context=self.context).data
