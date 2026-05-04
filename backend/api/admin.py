from django.contrib import admin

from .models import ChildProfile, Classroom, Lesson, TeacherProfile, ParentProfile, LessonAttendance
from .signals import sync_lessons_for_classroom


@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        sync_lessons_for_classroom(form.instance)


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    pass


@admin.register(ParentProfile)
class ParentProfileAdmin(admin.ModelAdmin):
    pass

@admin.register(ChildProfile)
class ChildProfileAdmin(admin.ModelAdmin):
    pass


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    pass


@admin.register(LessonAttendance)
class LessonAttendanceAdmin(admin.ModelAdmin):
    pass