from django.urls import path
from .views import (
    WorkspaceListCreateView, WorkspaceDetailView,
    WorkspaceMemberListView, AddWorkspaceMemberView,
    RemoveWorkspaceMemberView, UpdateMemberRoleView
)

urlpatterns = [
    path('', WorkspaceListCreateView.as_view(), name='workspace-list'),
    path('<uuid:pk>/', WorkspaceDetailView.as_view(), name='workspace-detail'),
    path('<uuid:workspace_id>/members/', WorkspaceMemberListView.as_view(), name='workspace-members'),
    path('<uuid:workspace_id>/members/add/', AddWorkspaceMemberView.as_view(), name='workspace-add-member'),
    path('<uuid:workspace_id>/members/<uuid:user_id>/remove/', RemoveWorkspaceMemberView.as_view(), name='workspace-remove-member'),
    path('<uuid:workspace_id>/members/<uuid:user_id>/role/', UpdateMemberRoleView.as_view(), name='workspace-member-role'),
]
