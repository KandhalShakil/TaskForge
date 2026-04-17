from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, VerifyRegistrationView, ResendOTPView,
    ForgotPasswordView, ResetPasswordView,
    CustomTokenObtainPairView, LogoutView,
    MeView, UserListView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('register/verify/', VerifyRegistrationView.as_view(), name='auth-register-verify'),
    path('verify-email/', VerifyRegistrationView.as_view(), name='auth-verify-email'),
    path('register/resend-otp/', ResendOTPView.as_view(), name='auth-resend-otp'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('forgot-password/reset/', ResetPasswordView.as_view(), name='auth-reset-password'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('users/', UserListView.as_view(), name='user-list'),
]
