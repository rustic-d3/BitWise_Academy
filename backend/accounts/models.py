from django.contrib.auth.models import AbstractUser
from django.db import models

from core.choices import ClassroomSubject, ScheduleDay


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        TEACHER = "TEACHER", "Teacher"
        PARENT = "PARENT", "Parent"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.PARENT)
    phone_number = models.CharField(max_length=20, null=True, blank=True)

    @property
    def is_teacher(self) -> bool:
        return self.role == self.Role.TEACHER

    @property
    def is_parent(self) -> bool:
        return self.role == self.Role.PARENT


class TeacherProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="teacher_profile"
    )
    description = models.TextField(max_length=200, null=True, blank=True)
    teaching_module = models.CharField(
        max_length=150,
        choices=ClassroomSubject.choices,
        null=True,
        blank=True,
    )
    profile_picture = models.CharField(max_length=500, blank=True, null=True)

    class Meta:
        verbose_name = "Teacher"
        verbose_name_plural = "Teachers"

    def __str__(self):
        return f"{self.user.username} - Teacher"


class ParentProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="parent_profile"
    )
    profile_picture = models.CharField(max_length=500, blank=True, null=True)

    class Meta:
        verbose_name = "Parent"
        verbose_name_plural = "Parents"

    def __str__(self):
        return f"{self.user.username} - Parent"


class ChildProfile(models.Model):
    parent = models.ForeignKey(
        ParentProfile, on_delete=models.CASCADE, related_name="children"
    )
    classroom = models.ForeignKey(
        "classrooms.Classroom",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="students",
    )
    credits = models.PositiveIntegerField(default=0)
    full_name = models.CharField(max_length=50, null=True)
    age = models.IntegerField(null=True, blank=True)

    class Meta:
        verbose_name = "Child"
        verbose_name_plural = "Children"

    def __str__(self):
        if not self.full_name:
            return f"Child {self.pk}"
        return f"{self.full_name} - {self.age} ani"


class TeacherAvailability(models.Model):
    """A weekly time window in which a teacher accepts make-up lessons."""

    teacher = models.ForeignKey(
        TeacherProfile, on_delete=models.CASCADE, related_name="availabilities"
    )
    day = models.CharField(max_length=3, choices=ScheduleDay.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        verbose_name = "Teacher Availability"
        verbose_name_plural = "Teacher Availabilities"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(start_time__lt=models.F("end_time")),
                name="availability_starts_before_it_ends",
            )
        ]

    def __str__(self):
        user = self.teacher.user
        return f"{user.first_name} {user.last_name} - {self.day} ({self.start_time} - {self.end_time})"
