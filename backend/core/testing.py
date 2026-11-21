"""Small factories shared by the test suites."""

from datetime import time, timedelta

from django.utils import timezone

from accounts.models import ChildProfile, ParentProfile, TeacherProfile, User
from classrooms.models import Classroom, Lesson


def make_teacher(username="teacher", **user_fields) -> TeacherProfile:
    user = User.objects.create_user(
        username=username, password="Passw0rd!", role=User.Role.TEACHER, **user_fields
    )
    return TeacherProfile.objects.create(user=user)


def make_parent(username="parent", **user_fields) -> ParentProfile:
    user = User.objects.create_user(
        username=username,
        password="Passw0rd!",
        role=User.Role.PARENT,
        email=f"{username}@example.com",
        **user_fields,
    )
    return ParentProfile.objects.create(user=user)


def make_classroom(teacher, day="Mon", at=time(18, 0)) -> Classroom:
    return Classroom.objects.create(teacher=teacher, schedule_day=day, schedule_time=at)


def make_child(parent, classroom=None, credits=0, name="Ana") -> ChildProfile:
    return ChildProfile.objects.create(
        parent=parent, classroom=classroom, credits=credits, full_name=name, age=10
    )


def make_lesson(classroom, days_from_now=1, **fields) -> Lesson:
    return Lesson.objects.create(
        classroom=classroom, date_time=timezone.now() + timedelta(days=days_from_now), **fields
    )
