from django.contrib import admin

from .models import TestResult


@admin.register(TestResult)
class TestResultAdmin(admin.ModelAdmin):
    list_display = ["child", "lesson", "score", "submitted_at"]
    list_select_related = ["child", "lesson"]
