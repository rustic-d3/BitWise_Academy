from django.contrib import admin
from django.contrib.auth import get_user_model

from .models import ChildProfile, Classroom, Lesson, TeacherProfile, ParentProfile
from .signals import sync_lessons_for_classroom

User = get_user_model()


def promote_to_teacher(modeladmin, request, queryset):
    for user in queryset:
        if user.role == User.Role.PARENT:
            ParentProfile.objects.filter(user=user).delete()
        user.role = User.Role.TEACHER
        user.save()
        TeacherProfile.objects.get_or_create(user=user)

promote_to_teacher.short_description = "Promote selected users to Teacher"


def demote_to_parent(modeladmin, request, queryset):
    for user in queryset:
        if user.role == User.Role.TEACHER:
            TeacherProfile.objects.filter(user=user).delete()
        user.role = User.Role.PARENT
        user.save()
        ParentProfile.objects.get_or_create(user=user)

demote_to_parent.short_description = "Demote selected users to Parent"


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ["username", "email", "role"]
    actions = [promote_to_teacher, demote_to_parent]


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
    readonly_fields = ["credits"]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ["channel_name", "date_time", "get_present_students", "get_skipped_by"]

    def get_present_students(self, obj):
        return ", ".join([child.full_name for child in obj.present_students.all()])
    
    get_present_students.short_description = "Elevi Prezenți"

    def get_skipped_by(self, obj):
        return ", ".join([child.full_name for child in obj.skipped_by.all()])
        
    get_skipped_by.short_description = "Absenți"

