from django.urls import path
from .views import (
    ProjectListCreateView, ProjectDetailView,
    ProjectMemberListView, AddProjectMemberView, RemoveProjectMemberView
)

urlpatterns = [
    path('', ProjectListCreateView.as_view(), name='project-list'),
    path('<uuid:pk>/', ProjectDetailView.as_view(), name='project-detail'),
    path('<uuid:project_id>/members/', ProjectMemberListView.as_view(), name='project-members'),
    path('<uuid:project_id>/members/add/', AddProjectMemberView.as_view(), name='project-add-member'),
    path('<uuid:project_id>/members/<uuid:user_id>/remove/', RemoveProjectMemberView.as_view(), name='project-remove-member'),
]
