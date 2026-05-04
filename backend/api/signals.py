from datetime import datetime, timedelta

from django.db.models.signals import m2m_changed
from django.dispatch import receiver

from .models import Classroom, Lesson, DAYS_MAP


def sync_lessons_for_classroom(instance):
    students = instance.students.all()

    if not students.exists():
        instance.lessons.update(is_canceled=True)
        return

    min_credits = students.order_by("credits").first().credits
    existing_lessons = instance.lessons.filter(is_canceled=False).count()

    if min_credits < existing_lessons:
        excess_lessons = instance.lessons.filter(
            is_canceled=False
        ).order_by("date_time")[min_credits:]

        for lesson in excess_lessons:
            lesson.is_canceled = True
            lesson.save()

    elif min_credits > existing_lessons:
        lessons_to_create = min_credits - existing_lessons

        last_lesson = instance.lessons.filter(
            is_canceled=False
        ).order_by("date_time").last()

        if last_lesson:
            start_date = last_lesson.date_time
        else:
            target_weekday = DAYS_MAP[instance.schedule_day]
            hour, minute = map(int, instance.schedule_time.split(":"))
            today = datetime.today()
            days_ahead = (target_weekday - today.weekday()) % 7 or 7
            start_date = today + timedelta(days=days_ahead)
            start_date = start_date.replace(hour=hour, minute=minute, second=0, microsecond=0)

        new_lessons = [
            Lesson(
                classroom=instance,
                date_time=start_date + timedelta(weeks=i + 1),
                is_canceled=False,
            )
            for i in range(lessons_to_create)
        ]
        Lesson.objects.bulk_create(new_lessons)


@receiver(m2m_changed, sender=Classroom.students.through)
def handle_students_change(sender, instance, action, pk_set, **kwargs):
    if action in ("post_add", "post_remove"):
        sync_lessons_for_classroom(instance)