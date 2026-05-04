from datetime import datetime, timedelta

from django.db import models
from django.contrib.auth.models import AbstractUser


class Module(models.TextChoices):
    M1 = "M1", "M1 - Introducere în programare"
    M2 = "M2", "M2 - Programare Python"
    M3 = "M3", "M3 - Programare Python avansat"


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        TEACHER = "TEACHER", "Teacher"
        PARENT = "PARENT", "Parent"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.PARENT)
    phone_number = models.CharField(max_length=20, null=True, blank=True)


class TeacherProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="teacher_profile")
    description = models.TextField(max_length=200, null=True, blank=True)
    teaching_module = models.CharField(
        max_length=50,
        choices=Module.choices,
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Teacher"
        verbose_name_plural = "Teachers"

    def set_description(self, description: str):
        self.description = description
        self.save()

    def get_description(self):
        return self.description or ""

    def __str__(self):
        return f"{self.user.username} - Teacher"


class ParentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="parent_profile")
    credits = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Parent"
        verbose_name_plural = "Parents"

    def __str__(self):
        return f"{self.user.username} - Parent"


DAYS_MAP = {
    "Mon": 0, "Tue": 1, "Wed": 2,
    "Thu": 3, "Fri": 4, "Sat": 5, "Sun": 6,
}


class Classroom(models.Model):
    teacher = models.ForeignKey(
        TeacherProfile,
        on_delete=models.CASCADE,
        related_name="classrooms",
    )
    students = models.ManyToManyField(
        ParentProfile,
        related_name="classrooms",
        blank=True,
    )
    schedule_day = models.CharField(max_length=3)
    schedule_time = models.CharField(max_length=5)
    whiteboard_files = models.JSONField(default=list, blank=True)
    is_canceled = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Classroom"
        verbose_name_plural = "Classrooms"

    def __str__(self):
        return f"Classroom {self.id} - {self.teacher.user.username}"


class Lesson(models.Model):
    classroom = models.ForeignKey(
        Classroom,
        on_delete=models.CASCADE,
        related_name="lessons",
    )
    date_time = models.DateTimeField()
    is_canceled = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Lesson"
        verbose_name_plural = "Lessons"

    def cancel_and_reschedule(self, new_datetime):
        self.is_canceled = True
        self.save()
        Lesson.objects.create(
            classroom=self.classroom,
            date_time=new_datetime,
            is_canceled=False,
        )

    def __str__(self):
        return f"Lesson {self.id} - {self.date_time}"


class LessonAttendance(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="attendance")
    student = models.ForeignKey(ParentProfile, on_delete=models.CASCADE)
    attended = models.BooleanField(default=False)

    class Meta:
        unique_together = ["lesson", "student"]