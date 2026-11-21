from django.db import models
from django.db.models import Q

from core.choices import ClassroomSubject, ScheduleDay


class ClassroomType(models.TextChoices):
    RO = "RO", "Română"
    ENG = "ENG", "Engleză"
    RO_EN = "RO/EN", "Română/Engleză"


class Classroom(models.Model):
    """A weekly group: one teacher, a fixed day/time, several children."""

    titlu = models.CharField(
        max_length=150,
        choices=ClassroomSubject.choices,
        default=ClassroomSubject.M1,
    )
    teacher = models.ForeignKey(
        "accounts.TeacherProfile", on_delete=models.CASCADE, related_name="classrooms"
    )
    schedule_day = models.CharField(
        max_length=3, choices=ScheduleDay.choices, default=ScheduleDay.MON
    )
    schedule_time = models.TimeField()
    classroom_type = models.CharField(
        max_length=5, choices=ClassroomType.choices, default=ClassroomType.RO
    )
    whiteboard_files = models.JSONField(default=list, blank=True)
    is_canceled = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Classroom"
        verbose_name_plural = "Classrooms"

    def __str__(self):
        return (
            f"Classroom {self.id} - {self.titlu} - {self.schedule_day} - "
            f"{self.schedule_time} - {self.teacher.user.username}"
        )


class LessonQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_canceled=False)

    def taught_by(self, user):
        return self.filter(classroom__teacher__user=user)

    def visible_to(self, user):
        """Lessons a user may open: their own as teacher, their children's as parent."""
        if user.is_superuser:
            return self
        if user.is_teacher:
            return self.taught_by(user)
        if user.is_parent:
            return self.filter(
                Q(classroom__students__parent__user=user)
                | Q(makeup_students__parent__user=user)
            ).distinct()
        return self.none()


class Lesson(models.Model):
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name="lessons")
    date_time = models.DateTimeField()
    is_canceled = models.BooleanField(default=False)

    # Make-up lessons are only visible to the children listed in makeup_students.
    is_makeup = models.BooleanField(default=False)
    makeup_students = models.ManyToManyField(
        "accounts.ChildProfile", blank=True, related_name="individual_makeup_lessons"
    )

    # Live session (Agora video channel + Netless whiteboard)
    channel_name = models.CharField(max_length=255, unique=True, blank=True, null=True)
    whiteboard_uuid = models.CharField(max_length=255, unique=True, blank=True, null=True)

    # Attendance
    present_students = models.ManyToManyField(
        "accounts.ChildProfile", blank=True, related_name="attended_lessons"
    )
    skipped_by = models.ManyToManyField(
        "accounts.ChildProfile", blank=True, related_name="skipped_lessons"
    )

    # Teaching material and the AI-generated quiz built from it
    lesson_material_text = models.TextField(blank=True, null=True)
    generated_test = models.JSONField(null=True, blank=True)
    is_test_active = models.BooleanField(default=False)

    objects = LessonQuerySet.as_manager()

    class Meta:
        verbose_name = "Lesson"
        verbose_name_plural = "Lessons"
        ordering = ["date_time"]

    def __str__(self):
        return f"Lesson {self.id} - {self.date_time}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # The default channel name needs the primary key, so it is set after the insert.
        if not self.channel_name:
            self.channel_name = self.default_channel_name
            super().save(update_fields=["channel_name"])

    @property
    def default_channel_name(self) -> str:
        return f"lesson_{self.id}_{self.classroom_id}"

    def close_channel(self) -> None:
        """Rename the video channel so nobody can rejoin the finished lesson."""
        self.channel_name = f"lesson_{self.id}_closed"
        self.save(update_fields=["channel_name"])

    def restore_channel(self) -> None:
        self.channel_name = self.default_channel_name
        self.save(update_fields=["channel_name"])

    def cancel_and_reschedule(self, new_datetime) -> "Lesson":
        self.is_canceled = True
        self.save(update_fields=["is_canceled"])
        return Lesson.objects.create(classroom=self.classroom, date_time=new_datetime)
