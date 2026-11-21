from django.utils import timezone
from rest_framework import serializers

from accounts.models import TeacherProfile
from accounts.serializers import (
    ChildProfileBasicSerializer,
    TeacherAvailabilitySerializer,
    validate_phone_e164,
)

from .models import Classroom, Lesson
from .video import build_session_credentials


class ClassroomTeacherSerializer(serializers.ModelSerializer):
    """Teacher as seen by parents: contact info plus slots for booking make-ups."""

    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    phone_number = serializers.CharField(
        source="user.phone_number", validators=[validate_phone_e164], required=False
    )
    availabilities = TeacherAvailabilitySerializer(many=True, read_only=True)
    booked_slots = serializers.SerializerMethodField()

    class Meta:
        model = TeacherProfile
        fields = [
            "first_name",
            "last_name",
            "description",
            "teaching_module",
            "availabilities",
            "booked_slots",
            "profile_picture",
            "email",
            "phone_number",
        ]

    def get_booked_slots(self, teacher):
        upcoming = Lesson.objects.active().filter(
            classroom__teacher=teacher, date_time__gte=timezone.now()
        )
        return [
            timezone.localtime(lesson.date_time).strftime("%Y-%m-%d %H:%M")
            for lesson in upcoming
        ]


class ClassroomSerializer(serializers.ModelSerializer):
    teacher = ClassroomTeacherSerializer(read_only=True)
    teacher_id = serializers.PrimaryKeyRelatedField(
        source="teacher", queryset=TeacherProfile.objects.all(), write_only=True
    )
    students = ChildProfileBasicSerializer(many=True, read_only=True)

    class Meta:
        model = Classroom
        fields = [
            "id",
            "titlu",
            "teacher",
            "teacher_id",
            "schedule_day",
            "schedule_time",
            "students",
            "classroom_type",
        ]


class LessonClassroomSerializer(serializers.ModelSerializer):
    students = ChildProfileBasicSerializer(many=True, read_only=True)

    class Meta:
        model = Classroom
        fields = ["id", "titlu", "students", "schedule_day", "schedule_time", "classroom_type"]


class LessonListSerializer(serializers.ModelSerializer):
    classroom = LessonClassroomSerializer(read_only=True)
    makeup_students = ChildProfileBasicSerializer(many=True, read_only=True)

    class Meta:
        model = Lesson
        fields = [
            "id",
            "date_time",
            "channel_name",
            "is_canceled",
            "is_makeup",
            "is_test_active",
            "classroom",
            "lesson_material_text",
            "makeup_students",
            "skipped_by",
        ]


class LessonJoinSerializer(serializers.ModelSerializer):
    agora_data = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ["id", "channel_name", "date_time", "agora_data", "is_test_active"]

    def get_agora_data(self, lesson):
        return build_session_credentials(lesson, self.context["request"].user)
