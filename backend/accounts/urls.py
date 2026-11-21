from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

urlpatterns = [
    # Authentication
    path("token/", TokenObtainPairView.as_view(), name="token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("user/register/", views.RegisterView.as_view(), name="register"),
    path("password-reset/", views.PasswordResetRequestView.as_view(), name="password-reset"),
    path(
        "password-reset-confirm/<uidb64>/<token>/",
        views.PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
    # Profiles
    path("user/profile-picture", views.ProfilePictureView.as_view(), name="profile-picture"),
    path("teacher/profile", views.TeacherProfileView.as_view(), name="teacher-profile"),
    path(
        "teacher/profile-settings",
        views.TeacherProfileView.as_view(),
        name="teacher-profile-settings",
    ),
    path("teacher/schedule/", views.TeacherScheduleView.as_view(), name="teacher-schedule"),
    path("parent/profile", views.ParentProfileView.as_view(), name="parent-profile"),
    path(
        "parent/profile-settings",
        views.ParentProfileView.as_view(),
        name="parent-profile-settings",
    ),
    # Children
    path("children/add/", views.ChildCreateView.as_view(), name="child-create"),
    path("child/<int:id>/", views.ChildDetailView.as_view(), name="child-detail"),
    path("child/<int:id>/update/", views.ChildUpdateView.as_view(), name="child-update"),
]
