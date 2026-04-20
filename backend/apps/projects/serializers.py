import uuid

from rest_framework import serializers

from apps.core.validation import date_order_error, required_field_errors
from apps.tasks.documents import TaskDocument
from apps.users.documents import UserDocument
from apps.users.serializers import UserSerializer

from .documents import FolderDocument, ProjectDocument, ProjectMemberDocument, SpaceDocument


class ProjectMemberSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    user = serializers.SerializerMethodField()
    user_id = serializers.CharField(write_only=True, required=False)
    role = serializers.ChoiceField(choices=('manager', 'member', 'viewer'), required=False, default='member')
    joined_at = serializers.DateTimeField(read_only=True)

    def get_user(self, obj):
        user = UserDocument.objects(id=str(getattr(obj, 'userId', ''))).first()
        return UserSerializer(user).data if user else None


class SpaceSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    workspace = serializers.CharField(source='workspaceId')
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    icon = serializers.CharField(required=False, allow_blank=True)
    color = serializers.CharField(required=False, allow_blank=True)
    order = serializers.IntegerField(required=False, min_value=0, default=0)
    list_count = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        space = SpaceDocument(
            id=validated_data.get('id') or str(uuid.uuid4()),
            workspaceId=validated_data['workspaceId'],
            name=validated_data['name'],
            description=validated_data.get('description', ''),
            icon=validated_data.get('icon', '🧭'),
            color=validated_data.get('color', '#3b82f6'),
            order=validated_data.get('order', 0),
            createdById=str(self.context['request'].user.id),
        )
        space.save()
        return space

    def update(self, instance, validated_data):
        for key, field in (
            ('workspaceId', 'workspaceId'),
            ('name', 'name'),
            ('description', 'description'),
            ('icon', 'icon'),
            ('color', 'color'),
            ('order', 'order'),
        ):
            if key in validated_data:
                setattr(instance, field, validated_data[key])
        instance.save()
        return instance

    def get_list_count(self, obj):
        return ProjectDocument.objects(spaceId=str(obj.id)).count()


class FolderSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    workspace = serializers.CharField(source='workspaceId')
    space = serializers.CharField(source='spaceId')
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    icon = serializers.CharField(required=False, allow_blank=True)
    color = serializers.CharField(required=False, allow_blank=True)
    order = serializers.IntegerField(required=False, min_value=0, default=0)
    list_count = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        folder = FolderDocument(
            id=validated_data.get('id') or str(uuid.uuid4()),
            workspaceId=validated_data['workspaceId'],
            spaceId=validated_data['spaceId'],
            name=validated_data['name'],
            description=validated_data.get('description', ''),
            icon=validated_data.get('icon', '🗂️'),
            color=validated_data.get('color', '#8b5cf6'),
            order=validated_data.get('order', 0),
            createdById=str(self.context['request'].user.id),
        )
        folder.save()
        return folder

    def update(self, instance, validated_data):
        for key, field in (
            ('workspaceId', 'workspaceId'),
            ('spaceId', 'spaceId'),
            ('name', 'name'),
            ('description', 'description'),
            ('icon', 'icon'),
            ('color', 'color'),
            ('order', 'order'),
        ):
            if key in validated_data:
                setattr(instance, field, validated_data[key])
        instance.save()
        return instance

    def get_list_count(self, obj):
        return ProjectDocument.objects(folderId=str(obj.id)).count()

    def validate(self, attrs):
        workspace = attrs.get('workspaceId') or getattr(self.instance, 'workspaceId', None)
        space = attrs.get('spaceId') or getattr(self.instance, 'spaceId', None)

        if workspace and space:
            space_doc = SpaceDocument.objects(id=str(space)).first()
            if space_doc and str(space_doc.workspaceId) != str(workspace):
                raise serializers.ValidationError({'space': 'Selected space must belong to the same workspace.'})
        return attrs


class ProjectSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    workspace = serializers.CharField(source='workspaceId')
    space = serializers.CharField(source='spaceId', allow_null=True, required=False)
    folder = serializers.CharField(source='folderId', allow_null=True, required=False)
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=True, allow_blank=False)
    icon = serializers.CharField(required=False, allow_blank=True)
    color = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=('active', 'archived', 'completed'), required=False, default='active')
    owner = serializers.SerializerMethodField()
    start_date = serializers.DateTimeField(required=True, allow_null=False)
    end_date = serializers.DateTimeField(required=True, allow_null=False)
    order = serializers.IntegerField(required=False, min_value=0, default=0)
    space_name = serializers.SerializerMethodField()
    folder_name = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    task_count = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def get_owner(self, obj):
        owner = UserDocument.objects(id=str(getattr(obj, 'ownerId', ''))).first()
        return UserSerializer(owner).data if owner else None

    def get_space_name(self, obj):
        if not getattr(obj, 'spaceId', None):
            return None
        space = SpaceDocument.objects(id=str(obj.spaceId)).first()
        return space.name if space else None

    def get_folder_name(self, obj):
        if not getattr(obj, 'folderId', None):
            return None
        folder = FolderDocument.objects(id=str(obj.folderId)).first()
        return folder.name if folder else None

    def get_member_count(self, obj):
        return ProjectMemberDocument.objects(projectId=str(obj.id)).count()

    def get_task_count(self, obj):
        return TaskDocument.objects(projectId=str(obj.id)).count()

    def validate(self, attrs):
        errors = required_field_errors(
            attrs,
            self.instance,
            [
                ('name', 'Title'),
                ('description', 'Description'),
                ('start_date', 'Start date'),
                ('end_date', 'End date'),
            ],
            partial=getattr(self, 'partial', False),
        )
        if errors:
            raise serializers.ValidationError(errors)

        if 'spaceId' in attrs and attrs['spaceId'] is None:
            attrs['spaceId'] = ''
        if 'folderId' in attrs and attrs['folderId'] is None:
            attrs['folderId'] = ''

        date_error = date_order_error(
            attrs.get('start_date') or getattr(self.instance, 'start_date', None),
            attrs.get('end_date') or getattr(self.instance, 'end_date', None),
        )
        if date_error:
            raise serializers.ValidationError({'end_date': date_error, 'error': date_error})

        workspace = attrs.get('workspaceId') or getattr(self.instance, 'workspaceId', None)
        space = attrs.get('spaceId') if 'spaceId' in attrs else getattr(self.instance, 'spaceId', None)
        folder = attrs.get('folderId') if 'folderId' in attrs else getattr(self.instance, 'folderId', None)

        if space and workspace:
            space_doc = SpaceDocument.objects(id=str(space)).first()
            if not space_doc or str(space_doc.workspaceId) != str(workspace):
                raise serializers.ValidationError({'space': 'Selected space must belong to the same workspace.'})

        if folder:
            folder_doc = FolderDocument.objects(id=str(folder)).first()
            if not folder_doc:
                raise serializers.ValidationError({'folder': 'Selected folder does not exist.'})
            if workspace and str(folder_doc.workspaceId) != str(workspace):
                raise serializers.ValidationError({'folder': 'Selected folder must belong to the same workspace.'})
            if space and str(folder_doc.spaceId) != str(space):
                raise serializers.ValidationError({'folder': 'Selected folder must belong to the selected space.'})

        if space is None and folder is not None:
            folder_doc = FolderDocument.objects(id=str(folder)).first()
            if folder_doc:
                attrs['spaceId'] = str(folder_doc.spaceId)

        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        project = ProjectDocument(
            id=validated_data.get('id') or str(uuid.uuid4()),
            workspaceId=validated_data['workspaceId'],
            spaceId=validated_data.get('spaceId') or '',
            folderId=validated_data.get('folderId') or '',
            name=validated_data['name'],
            description=validated_data.get('description', ''),
            icon=validated_data.get('icon', '📁'),
            color=validated_data.get('color', '#8b5cf6'),
            status=validated_data.get('status', 'active'),
            ownerId=str(user.id),
            start_date=validated_data.get('start_date'),
            end_date=validated_data.get('end_date'),
            order=validated_data.get('order', 0),
        )
        project.save()

        ProjectMemberDocument(
            id=str(uuid.uuid4()),
            projectId=str(project.id),
            userId=str(user.id),
            role='manager',
        ).save()

        return project

    def update(self, instance, validated_data):
        for key in (
            'workspaceId',
            'spaceId',
            'folderId',
            'name',
            'description',
            'icon',
            'color',
            'status',
            'start_date',
            'end_date',
            'order',
        ):
            if key in validated_data:
                value = validated_data[key]
                if key in ('spaceId', 'folderId') and value is None:
                    value = ''
                setattr(instance, key, value)
        instance.save()
        return instance


class ProjectDetailSerializer(ProjectSerializer):
    members = serializers.SerializerMethodField()

    def get_members(self, obj):
        members = ProjectMemberDocument.objects(projectId=str(obj.id))
        return ProjectMemberSerializer(members, many=True, context=self.context).data


class HierarchyProjectSerializer(ProjectSerializer):
    task_count = serializers.SerializerMethodField()

    def get_task_count(self, obj):
        return TaskDocument.objects(projectId=str(obj.id)).count()


class HierarchyFolderSerializer(FolderSerializer):
    folderId = serializers.SerializerMethodField()
    lists = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()

    def get_folderId(self, obj):
        return str(obj.id)

    def get_lists(self, obj):
        lists_qs = ProjectDocument.objects(folderId=str(obj.id))
        return HierarchyProjectSerializer(lists_qs, many=True, context=self.context).data

    def get_projects(self, obj):
        return self.get_lists(obj)


class HierarchySpaceSerializer(SpaceSerializer):
    folders = serializers.SerializerMethodField()
    lists = serializers.SerializerMethodField()

    def get_folders(self, obj):
        folders_qs = FolderDocument.objects(spaceId=str(obj.id))
        return HierarchyFolderSerializer(folders_qs, many=True, context=self.context).data

    def get_lists(self, obj):
        root_lists = ProjectDocument.objects(spaceId=str(obj.id), folderId__in=[None, ''])
        return HierarchyProjectSerializer(root_lists, many=True, context=self.context).data
