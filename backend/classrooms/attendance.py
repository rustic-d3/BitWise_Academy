from enum import Enum

from django.db import transaction
from django.db.models import F

from accounts.models import ChildProfile

from .models import Lesson


class JoinResult(Enum):
    ALREADY_PRESENT = "already_present"
    NO_CREDITS = "no_credits"
    CREDIT_CONSUMED = "credit_consumed"


@transaction.atomic
def consume_credit_and_join(lesson: Lesson, child: ChildProfile) -> JoinResult:
    """Spend one credit to enter a lesson. Rejoining the same lesson is free."""
    child = ChildProfile.objects.select_for_update().get(pk=child.pk)

    if lesson.present_students.filter(pk=child.pk).exists():
        return JoinResult.ALREADY_PRESENT
    if child.credits <= 0:
        return JoinResult.NO_CREDITS

    # queryset.update() on purpose: attending a lesson must not trigger the
    # post_save calendar resync, because the lesson was already paid for.
    ChildProfile.objects.filter(pk=child.pk).update(credits=F("credits") - 1)
    lesson.present_students.add(child)
    return JoinResult.CREDIT_CONSUMED
