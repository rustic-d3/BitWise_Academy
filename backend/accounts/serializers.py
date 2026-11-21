import re

from django.core.validators import RegexValidator
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import ChildProfile, ParentProfile, TeacherAvailability, TeacherProfile, User


def validate_phone_e164(value):
    if not re.match(r"^\+[1-9]\d{7,14}$", value):
        raise serializers.ValidationError(
            "Numărul trebuie să fie în format internațional: +40712345678"
        )
    return value


class RoleTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds the user's role to the JWT so the frontend can route by role."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        return token


class UserSerializer(serializers.ModelSerializer):
    """Public registration. Creates the matching Teacher/Parent profile."""

    phone_number = serializers.CharField(
        required=False,
        allow_blank=True,
        validators=[
            RegexValidator(
                regex=r"^\+?1?\d{9,15}$",
                message="Phone number must be in format: '+999999999'. Up to 15 digits.",
            )
        ],
    )
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={"min_length": "Password must be at least 8 characters."},
    )
    description = serializers.CharField(write_only=True, required=False, allow_blank=True)
    teaching_module = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "username",
            "password",
            "email",
            "role",
            "phone_number",
            "description",
            "teaching_module",
        ]
        extra_kwargs = {"role": {"required": False}}

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already in use.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    def validate_password(self, value):
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one number.")
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError(
                "Password must contain at least one uppercase letter."
            )
        return value

    def validate_phone_number(self, value):
        if value and User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("This phone number is already in use.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        description = validated_data.pop("description", None)
        teaching_module = validated_data.pop("teaching_module", None)
        requested_role = validated_data.pop("role", User.Role.PARENT)

        # Public sign-ups are always parents; only a superuser may pick another role.
        request = self.context.get("request")
        is_superuser = bool(request and request.user.is_superuser)
        role = requested_role if is_superuser else User.Role.PARENT

        if not validated_data.get("phone_number"):
            validated_data.pop("phone_number", None)

        user = User.objects.create_user(role=role, **validated_data)

        if role == User.Role.TEACHER:
            TeacherProfile.objects.create(
                user=user, teaching_module=teaching_module, description=description
            )
        elif role == User.Role.PARENT:
            ParentProfile.objects.create(user=user)

        return user


class TeacherAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherAvailability
        fields = ["day", "start_time", "end_time"]


class TeacherProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    phone_number = serializers.CharField(
        source="user.phone_number", validators=[validate_phone_e164], required=False
    )
    availabilities = TeacherAvailabilitySerializer(many=True, read_only=True)

    class Meta:
        model = TeacherProfile
        fields = [
            "first_name",
            "last_name",
            "description",
            "teaching_module",
            "availabilities",
            "profile_picture",
            "email",
            "phone_number",
        ]


class ChildProfileBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChildProfile
        fields = ["id", "full_name", "credits", "parent"]


class ChildProfileSerializer(serializers.ModelSerializer):
    classroom = serializers.SerializerMethodField()

    class Meta:
        model = ChildProfile
        fields = ["id", "full_name", "credits", "parent", "classroom", "age"]
        read_only_fields = ["id", "parent"]

    def get_classroom(self, obj):
        if not obj.classroom:
            return None
        # Imported here because classrooms.serializers depends on this module.
        from classrooms.serializers import ClassroomSerializer

        return ClassroomSerializer(obj.classroom, context=self.context).data


class ParentProfileSerializer(serializers.ModelSerializer):
    children = ChildProfileSerializer(many=True, read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    phone_number = serializers.CharField(source="user.phone_number", read_only=True)

    class Meta:
        model = ParentProfile
        fields = "__all__"
