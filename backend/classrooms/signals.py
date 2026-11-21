from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.models import ChildProfile

from .scheduling import sync_lessons_for_classroom


@receiver(post_save, sender=ChildProfile)
def resync_classroom_lessons(sender, instance, **kwargs):
    """A child joined a classroom or their credits changed: rebuild the calendar."""
    if instance.classroom_id:
        sync_lessons_for_classroom(instance.classroom)
