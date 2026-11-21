from django.apps import AppConfig


class ClassroomsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "classrooms"
    verbose_name = "Classrooms & Lessons"

    def ready(self):
        from . import signals  # noqa: F401  (registers signal handlers)
