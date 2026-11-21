from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import ChildProfile, ParentProfile, TeacherAvailability, TeacherProfile, User


@admin.action(description="Promote selected users to Teacher")
def promote_to_teacher(modeladmin, request, queryset):
    for user in queryset:
        ParentProfile.objects.filter(user=user).delete()
        user.role = User.Role.TEACHER
        user.save(update_fields=["role"])
        TeacherProfile.objects.get_or_create(user=user)


@admin.action(description="Demote selected users to Parent")
def demote_to_parent(modeladmin, request, queryset):
    for user in queryset:
        TeacherProfile.objects.filter(user=user).delete()
        user.role = User.Role.PARENT
        user.save(update_fields=["role"])
        ParentProfile.objects.get_or_create(user=user)


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    """Django's user admin (proper password hashing) plus role and phone."""

    list_display = ["username", "email", "role", "is_staff"]
    list_filter = ["role", "is_staff", "is_superuser"]
    actions = [promote_to_teacher, demote_to_parent]
    fieldsets = DjangoUserAdmin.fieldsets + (("BitWise", {"fields": ("role", "phone_number")}),)
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ("BitWise", {"fields": ("email", "role", "phone_number")}),
    )


class TeacherAvailabilityInline(admin.TabularInline):
    model = TeacherAvailability
    extra = 0


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "teaching_module"]
    inlines = [TeacherAvailabilityInline]


@admin.register(ParentProfile)
class ParentProfileAdmin(admin.ModelAdmin):
    list_display = ["user"]


@admin.register(ChildProfile)
class ChildProfileAdmin(admin.ModelAdmin):
    list_display = ["full_name", "age", "parent", "classroom", "credits"]
    list_filter = ["classroom"]
    readonly_fields = ["credits"]
