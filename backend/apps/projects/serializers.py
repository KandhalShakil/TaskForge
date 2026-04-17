from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project, ProjectMember, Space, Folder
from apps.users.serializers import UserSerializer

User = get_user_model()


class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = ProjectMember
        fields = ['id', 'user', 'user_id', 'role', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class SpaceSerializer(serializers.ModelSerializer):
    list_count = serializers.SerializerMethodField()

    class Meta:
        model = Space
        fields = [
            'id', 'workspace', 'name', 'description', 'icon', 'color',
            'order', 'list_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_list_count(self, obj):
        return obj.projects.count() + Project.objects.filter(folder__space=obj).count()


class FolderSerializer(serializers.ModelSerializer):
    list_count = serializers.SerializerMethodField()

    class Meta:
        model = Folder
        fields = [
            'id', 'workspace', 'space', 'name', 'description', 'icon', 'color',
            'order', 'list_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_list_count(self, obj):
        return obj.projects.count()

    def validate(self, attrs):
        workspace = attrs.get('workspace') or getattr(self.instance, 'workspace', None)
        space = attrs.get('space') or getattr(self.instance, 'space', None)

        if workspace and space and space.workspace_id != workspace.id:
            raise serializers.ValidationError({'space': 'Selected space must belong to the same workspace.'})
        return attrs


class ProjectSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    task_count = serializers.SerializerMethodField()
    space_name = serializers.CharField(source='space.name', read_only=True)
    folder_name = serializers.CharField(source='folder.name', read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'workspace', 'space', 'folder', 'name', 'description', 'icon', 'color',
            'status', 'owner', 'start_date', 'end_date', 'order',
            'space_name', 'folder_name',
            'member_count', 'task_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        return obj.members.count()

    def get_task_count(self, obj):
        return obj.tasks.count()

    def validate(self, attrs):
        workspace = attrs.get('workspace') or getattr(self.instance, 'workspace', None)
        space = attrs.get('space') or getattr(self.instance, 'space', None)
        folder = attrs.get('folder') or getattr(self.instance, 'folder', None)

        if space and workspace and space.workspace_id != workspace.id:
            raise serializers.ValidationError({'space': 'Selected space must belong to the same workspace.'})

        if folder:
            if workspace and folder.workspace_id != workspace.id:
                raise serializers.ValidationError({'folder': 'Selected folder must belong to the same workspace.'})
            if space and folder.space_id != space.id:
                raise serializers.ValidationError({'folder': 'Selected folder must belong to the selected space.'})

        if space is None and folder is not None:
            attrs['space'] = folder.space

        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        project = Project.objects.create(owner=user, **validated_data)
        ProjectMember.objects.create(
            project=project,
            user=user,
            role=ProjectMember.Role.MANAGER
        )
        return project


class ProjectDetailSerializer(ProjectSerializer):
    members = ProjectMemberSerializer(many=True, read_only=True)

    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + ['members']


class HierarchyProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'workspace', 'space', 'folder', 'name', 'icon', 'color', 'status', 'task_count']

    task_count = serializers.SerializerMethodField()

    def get_task_count(self, obj):
        return obj.tasks.count()


class HierarchyFolderSerializer(FolderSerializer):
    lists = serializers.SerializerMethodField()

    class Meta(FolderSerializer.Meta):
        fields = FolderSerializer.Meta.fields + ['lists']

    def get_lists(self, obj):
        lists_qs = obj.projects.select_related('workspace', 'space', 'folder').prefetch_related('tasks')
        return HierarchyProjectSerializer(lists_qs, many=True).data


class HierarchySpaceSerializer(SpaceSerializer):
    folders = serializers.SerializerMethodField()
    lists = serializers.SerializerMethodField()

    class Meta(SpaceSerializer.Meta):
        fields = SpaceSerializer.Meta.fields + ['folders', 'lists']

    def get_folders(self, obj):
        folders_qs = obj.folders.select_related('workspace', 'space').prefetch_related('projects__tasks')
        return HierarchyFolderSerializer(folders_qs, many=True).data

    def get_lists(self, obj):
        root_lists = obj.projects.filter(folder__isnull=True).select_related('workspace', 'space', 'folder').prefetch_related('tasks')
        return HierarchyProjectSerializer(root_lists, many=True).data
