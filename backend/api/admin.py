from django.contrib import admin
from api.models import User, TeacherProfile, ParentProfile

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    actions = ["promote_to_teacher"]

    def promote_to_teacher(self, request, queryset):
        for user in queryset:
            if user.role != User.Role.TEACHER:
                user.role = User.Role.TEACHER
                user.save()
                ParentProfile.objects.filter(user=user).delete()
                TeacherProfile.objects.get_or_create(user=user)
        self.message_user(request, "Selected users have been promoted to Teacher.")

    promote_to_teacher.short_description = "Promote to Teacher"

admin.site.register(TeacherProfile)
admin.site.register(ParentProfile)