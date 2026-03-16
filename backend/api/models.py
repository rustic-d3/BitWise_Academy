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

class TeacherProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="teacher_profile")
    description = models.TextField(max_length=200, null=True, blank=True)
    teaching_module = models.CharField(
        max_length=50,
        choices=Module.choices,
        null=True,
        blank=True
    )

    class Meta:
        verbose_name = "Teacher"
        verbose_name_plural = "Teachers"

    def __str__(self):
        return f"{self.user.username} - Teacher"

class ParentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="parent_profile")
    phone_number = models.CharField(max_length=20, null=True, blank=True)

    class Meta:
        verbose_name = "Parent"
        verbose_name_plural = "Parents"

    def __str__(self):
        return f"{self.user.username} - Parent"
