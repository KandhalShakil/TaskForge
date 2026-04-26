from django.urls import path
from .views import CompanyCheckView

urlpatterns = [
    path('check/', CompanyCheckView.as_view(), name='company-check'),
]
