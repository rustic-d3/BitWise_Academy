from django.contrib import admin

from .models import Classroom, Lesson
from .scheduling import sync_lessons_for_classroom


@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ["id", "titlu", "teacher", "schedule_day", "schedule_time", "classroom_type"]
    list_filter = ["titlu", "schedule_day", "classroom_type", "is_canceled"]

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        sync_lessons_for_classroom(form.instance)


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ["channel_name", "date_time", "is_canceled", "is_makeup", "present", "absent"]
    list_filter = ["is_canceled", "is_makeup", "classroom"]
    date_hierarchy = "date_time"

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("present_students", "skipped_by")

    @admin.display(description="Elevi Prezenți")
    def present(self, obj):
        return ", ".join(child.full_name or "" for child in obj.present_students.all())

    @admin.display(description="Absenți")
    def absent(self, obj):
        return ", ".join(child.full_name or "" for child in obj.skipped_by.all())
