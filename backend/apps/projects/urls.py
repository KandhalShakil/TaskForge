from django.urls import path
from .views import (
    ProjectListCreateView, ProjectDetailView,
    ProjectMemberListView, AddProjectMemberView, RemoveProjectMemberView,
    SpaceListCreateView, SpaceDetailView,
    FolderListCreateView, FolderDetailView,
    ProjectHierarchyView,
)

urlpatterns = [
    path('hierarchy/', ProjectHierarchyView.as_view(), name='project-hierarchy'),
    path('spaces/', SpaceListCreateView.as_view(), name='space-list'),
    path('spaces/<uuid:pk>/', SpaceDetailView.as_view(), name='space-detail'),
    path('folders/', FolderListCreateView.as_view(), name='folder-list'),
    path('folders/<uuid:pk>/', FolderDetailView.as_view(), name='folder-detail'),
    path('', ProjectListCreateView.as_view(), name='project-list'),
    path('<uuid:pk>/', ProjectDetailView.as_view(), name='project-detail'),
    path('<uuid:project_id>/members/', ProjectMemberListView.as_view(), name='project-members'),
    path('<uuid:project_id>/members/add/', AddProjectMemberView.as_view(), name='project-add-member'),
    path('<uuid:project_id>/members/<uuid:user_id>/remove/', RemoveProjectMemberView.as_view(), name='project-remove-member'),
]
