"""Lesson calendar rules.

A credit pays for one lesson. A classroom always has as many *upcoming* regular
lessons as the least-credited child in it has credits left. Lessons repeat
weekly on the classroom's day and time.
"""

from datetime import datetime, timedelta

from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_time

from accounts.models import ChildProfile
from core.choices import WEEKDAY_INDEX

from .models import Classroom, Lesson


class SchedulingError(ValueError):
    pass


def next_occurrence(classroom: Classroom, after: datetime | None = None) -> datetime:
    """The next date strictly after `after` that falls on the classroom's day and time."""
    after = timezone.localtime(after or timezone.now())
    days_ahead = (WEEKDAY_INDEX[classroom.schedule_day] - after.weekday()) % 7 or 7
    day = after + timedelta(days=days_ahead)
    t = classroom.schedule_time
    return day.replace(hour=t.hour, minute=t.minute, second=0, microsecond=0)


@transaction.atomic
def sync_lessons_for_classroom(classroom: Classroom) -> None:
    active = (
        classroom.lessons.active()
        .filter(is_makeup=False, date_time__gt=timezone.now())
        .order_by("date_time")
    )
    students = classroom.students.all()

    if not students.exists():
        active.update(is_canceled=True)
        return

    min_credits = students.order_by("credits").values_list("credits", flat=True).first()
    existing = active.count()

    if min_credits < existing:
        excess_ids = list(active.values_list("id", flat=True)[min_credits:])
        Lesson.objects.filter(id__in=excess_ids).update(is_canceled=True)

    elif min_credits > existing:
        last = active.last()
        start = last.date_time + timedelta(weeks=1) if last else next_occurrence(classroom)
        for week in range(min_credits - existing):
            # .create() rather than bulk_create so Lesson.save() assigns the channel name.
            Lesson.objects.create(classroom=classroom, date_time=start + timedelta(weeks=week))


def reschedule_at_end_of_course(lesson: Lesson) -> Lesson:
    """Cancel `lesson` and add a replacement one week after the classroom's last lesson."""
    last = lesson.classroom.lessons.order_by("-date_time").first()
    return lesson.cancel_and_reschedule(last.date_time + timedelta(days=7))


def schedule_makeup_lesson(child: ChildProfile, date_str: str, time_str: str) -> Lesson:
    """Book a make-up lesson ('YYYY-MM-DD', 'HH:MM') with the child's classroom teacher."""
    if not child.classroom:
        raise SchedulingError(
            "Acest copil nu are încă o clasă atribuită. Nu poți programa o recuperare."
        )

    day, at = parse_date(date_str or ""), parse_time(time_str or "")
    if not day or not at:
        raise SchedulingError("Data sau ora recuperării este invalidă.")

    when = timezone.make_aware(datetime.combine(day, at))
    lesson, _ = Lesson.objects.get_or_create(
        classroom=child.classroom, date_time=when, is_makeup=True
    )
    lesson.makeup_students.add(child)
    return lesson
