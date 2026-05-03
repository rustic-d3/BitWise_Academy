from django.contrib import admin
from api.models import User, TeacherProfile, ParentProfile

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    actions = ["promote_to_teacher", "change_to_parent_role"]

    def promote_to_teacher(self, request, queryset):
        for user in queryset:
            if user.role != User.Role.TEACHER:
                user.role = User.Role.TEACHER
                user.save()
                ParentProfile.objects.filter(user=user).delete()
                TeacherProfile.objects.get_or_create(user=user)
        self.message_user(request, "Selected users have been promoted to Teacher role.")
        
    def change_to_parent_role(self, request, queryset):
        for user in queryset:
            if user.role != User.Role.PARENT:
                user.role = User.Role.PARENT
                user.save()
                TeacherProfile.objects.filter(user=user).delete()
                ParentProfile.objects.get_or_create(user=user)
        self.message_user(request, "Selected users have been promoted to Parent role.")

    change_to_parent_role.short_description = "Change to Parent role"
    promote_to_teacher.short_description = "Change to Teacher role"

admin.site.register(TeacherProfile)
admin.site.register(ParentProfile)