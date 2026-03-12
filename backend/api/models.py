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

class Teacher(User):
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

    def save(self, *args, **kwargs):
        self.role = User.Role.TEACHER
        super().save(*args, **kwargs)

class Parent(User):
    phone_number = models.CharField(max_length=20)

    class Meta:
        verbose_name = "Parent"
        verbose_name_plural = "Parents"

    def save(self, *args, **kwargs):
        self.role = User.Role.PARENT
        super().save(*args, **kwargs)