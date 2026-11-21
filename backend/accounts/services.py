"""Business logic for accounts: password reset, profile updates, teacher availability."""

from dataclasses import dataclass
from datetime import datetime

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import transaction
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from core.choices import ROMANIAN_DAY_NAMES

from .models import TeacherAvailability, TeacherProfile
from .storage import avatar_filename, upload_profile_picture


def send_password_reset_email(user) -> None:
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    reset_link = f"{settings.FRONTEND_URL}/reset-password/{uidb64}/{token}/"

    send_mail(
        subject="Cerere de resetare a parolei - Bitwise Academy",
        message=(
            f"Salut {user.first_name},\n\n"
            f"Apasă pe link-ul de mai jos pentru a reseta parola:\n{reset_link}\n\n"
            "Dacă nu ai cerut resetarea parolei, ignoră acest email."
        ),
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[user.email],
        fail_silently=False,
    )


@transaction.atomic
def update_profile(profile, *, data, files, avatar_prefix: str, allow_password: bool) -> None:
    """Apply a profile-settings form to a Teacher/Parent profile and its user."""
    user = profile.user

    picture = files.get("profile_picture")
    if picture:
        filename = avatar_filename(avatar_prefix, user.id, picture.name)
        profile.profile_picture = upload_profile_picture(picture, filename)

    if data.get("email"):
        user.email = data["email"]
    if data.get("phone_number") is not None:
        user.phone_number = data["phone_number"]
    if allow_password and data.get("password"):
        user.set_password(data["password"])
    user.save()

    if isinstance(profile, TeacherProfile) and data.get("description") is not None:
        profile.description = data["description"]
    profile.save()


class ScheduleError(Exception):
    def __init__(self, message: str, conflict: bool = False):
        super().__init__(message)
        self.message = message
        self.conflict = conflict


@dataclass(frozen=True)
class AvailabilitySlot:
    day: str
    day_label: str
    start_time: object
    end_time: object


def parse_schedule(rows: list[dict]) -> list[AvailabilitySlot]:
    """Validate rows like {"day": "Luni", "startTime": "18:00", "endTime": "20:00"}."""
    slots = []
    for row in rows:
        day_label, start, end = row.get("day"), row.get("startTime"), row.get("endTime")
        if not day_label or not start or not end:
            continue

        day = ROMANIAN_DAY_NAMES.get(day_label)
        if not day:
            raise ScheduleError(f"Zi invalidă trimisă din frontend: {day_label}")

        try:
            start_time = datetime.strptime(start, "%H:%M").time()
            end_time = datetime.strptime(end, "%H:%M").time()
        except ValueError:
            raise ScheduleError("Formatul orei este invalid.")

        if start_time >= end_time:
            raise ScheduleError(
                f"Ora de început trebuie să fie înaintea orei de sfârșit pentru ziua de {day_label}."
            )
        slots.append(AvailabilitySlot(day, day_label, start_time, end_time))
    return slots


@transaction.atomic
def replace_teacher_availability(teacher: TeacherProfile, rows: list[dict]) -> None:
    """Replace the teacher's make-up availability.

    A window may not overlap the start of one of the teacher's regular classes.
    """
    slots = parse_schedule(rows)
    classrooms = list(teacher.classrooms.filter(is_canceled=False))

    for slot in slots:
        for classroom in classrooms:
            starts_inside = slot.start_time <= classroom.schedule_time < slot.end_time
            if classroom.schedule_day == slot.day and starts_inside:
                raise ScheduleError(
                    f"Atenție: Nu poți seta recuperări {slot.day_label} între "
                    f"{slot.start_time:%H:%M} și {slot.end_time:%H:%M}, deoarece ai deja "
                    f"o grupă normală programată la ora {classroom.schedule_time:%H:%M}!",
                    conflict=True,
                )

    teacher.availabilities.all().delete()
    TeacherAvailability.objects.bulk_create(
        TeacherAvailability(
            teacher=teacher, day=slot.day, start_time=slot.start_time, end_time=slot.end_time
        )
        for slot in slots
    )
