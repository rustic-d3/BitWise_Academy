from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsParent, IsTeacher

from . import services
from .models import ChildProfile, User
from .serializers import (
    ChildProfileSerializer,
    ParentProfileSerializer,
    TeacherProfileSerializer,
    UserSerializer,
)
from .storage import StorageUploadError

RESET_EMAIL_SENT = "If an account with that email exists, a reset link has been sent."


# --- Authentication ----------------------------------------------------------


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if user:
            services.send_password_reset_email(user)

        # Same answer either way, so the endpoint can't be used to discover accounts.
        return Response({"message": RESET_EMAIL_SENT}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        new_password = request.data.get("new_password")
        if not new_password:
            return Response(
                {"error": "New password is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(uidb64)))
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response(
                {"error": "The reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        return Response(
            {"message": "Password has been successfully reset!"}, status=status.HTTP_200_OK
        )


# --- Profiles ----------------------------------------------------------------


class ProfilePictureView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_teacher:
            profile = user.teacher_profile
        elif user.is_parent:
            profile = user.parent_profile
        else:
            return Response(
                {"error": "Poza de profil nu a putut fi extrasă."},
                status=status.HTTP_404_NOT_FOUND,
            )

        picture = profile.profile_picture or settings.DEFAULT_AVATAR_URL
        return Response({"profile_picture": picture}, status=status.HTTP_200_OK)


class _ProfileSettingsView(generics.RetrieveUpdateAPIView):
    """GET returns the profile; PUT/PATCH accepts the multipart settings form."""

    avatar_prefix = ""
    allow_password_change = False

    def update(self, request, *args, **kwargs):
        profile = self.get_object()
        try:
            services.update_profile(
                profile,
                data=request.data,
                files=request.FILES,
                avatar_prefix=self.avatar_prefix,
                allow_password=self.allow_password_change,
            )
        except StorageUploadError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(self.get_serializer(profile).data, status=status.HTTP_200_OK)


class TeacherProfileView(_ProfileSettingsView):
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsTeacher]
    avatar_prefix = "teacher"
    allow_password_change = True

    def get_object(self):
        return self.request.user.teacher_profile


class ParentProfileView(_ProfileSettingsView):
    serializer_class = ParentProfileSerializer
    permission_classes = [IsParent]
    avatar_prefix = "parent"

    def get_object(self):
        return self.request.user.parent_profile


class TeacherScheduleView(APIView):
    """Replace the teacher's weekly availability for make-up lessons."""

    permission_classes = [IsTeacher]

    def post(self, request):
        try:
            services.replace_teacher_availability(
                request.user.teacher_profile, request.data.get("schedule", [])
            )
        except services.ScheduleError as exc:
            code = status.HTTP_409_CONFLICT if exc.conflict else status.HTTP_400_BAD_REQUEST
            return Response({"error": exc.message}, status=code)

        return Response(
            {"message": "Programul a fost salvat cu succes!"}, status=status.HTTP_200_OK
        )


# --- Children ----------------------------------------------------------------


class ParentChildrenMixin:
    """Parents can only see and edit their own children."""

    serializer_class = ChildProfileSerializer
    permission_classes = [IsParent]
    lookup_field = "id"

    def get_queryset(self):
        return ChildProfile.objects.filter(parent__user=self.request.user).select_related(
            "classroom"
        )


class ChildCreateView(ParentChildrenMixin, generics.CreateAPIView):
    def perform_create(self, serializer):
        serializer.save(parent=self.request.user.parent_profile)


class ChildDetailView(ParentChildrenMixin, generics.RetrieveAPIView):
    pass


class ChildUpdateView(ParentChildrenMixin, generics.UpdateAPIView):
    pass
