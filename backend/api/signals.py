from datetime import datetime, timedelta
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ChildProfile, Lesson, Classroom, DAYS_MAP


def sync_lessons_for_classroom(classroom_instance):
    students = classroom_instance.students.all()

    # If no students are in the class, cancel all active lessons
    if not students.exists():
        classroom_instance.lessons.filter(is_canceled=False).update(is_canceled=True)
        return

    # Find the minimum credits among all children enrolled in this classroom
    min_credits = students.order_by("credits").first().credits
    existing_lessons = classroom_instance.lessons.filter(is_canceled=False).count()

    # Case 1: The minimum credits is less than existing lessons -> Cancel the excess lessons
    if min_credits < existing_lessons:
        excess_lessons = classroom_instance.lessons.filter(
            is_canceled=False
        ).order_by("date_time")[min_credits:]

        for lesson in excess_lessons:
            lesson.is_canceled = True
            lesson.save()

    # Case 2: The minimum credits is greater than existing lessons -> Create new lessons
    elif min_credits > existing_lessons:
        lessons_to_create = min_credits - existing_lessons

        last_lesson = classroom_instance.lessons.filter(
            is_canceled=False
        ).order_by("date_time").last()

        if last_lesson:
            start_date = last_lesson.date_time + timedelta(weeks=1)
        else:
            target_weekday = DAYS_MAP[classroom_instance.schedule_day]
            today = datetime.today()
            days_ahead = (target_weekday - today.weekday()) % 7 or 7
            t = classroom_instance.schedule_time
            start_date = (today + timedelta(days=days_ahead)).replace(  # ← assign first, then replace
            hour=t.hour, minute=t.minute, second=0, microsecond=0
    )
            

        new_lessons = [
            Lesson(
                classroom=classroom_instance,
                date_time=start_date + timedelta(weeks=i),
                is_canceled=False,
            )
            for i in range(lessons_to_create)
        ]
        Lesson.objects.bulk_create(new_lessons)


@receiver(post_save, sender=ChildProfile)
def handle_child_classroom_change(sender, instance, created, **kwargs):
    """
    Triggers when a child is assigned or changed between classrooms.
    """
    if instance.classroom:
        sync_lessons_for_classroom(instance.classroom)