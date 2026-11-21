from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api-auth/", include("rest_framework.urls")),
    path("api/", include("accounts.urls")),
    path("api/", include("classrooms.urls")),
    path("api/", include("assessments.urls")),
    path("api/", include("assistant.urls")),
]
