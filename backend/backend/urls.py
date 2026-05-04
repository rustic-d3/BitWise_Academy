
from django.contrib import admin
from django.urls import path, include
from api.views import CreateUserView, TeacherProfileView, CreateClassroomView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/user/register/', CreateUserView.as_view(), name='register'),
    path("api/token/", TokenObtainPairView.as_view(), name='token'),
    path("api/token/refresh", TokenRefreshView.as_view(), name='refresh'),
    # teacher urls
    path("api/teacher/profile", TeacherProfileView.as_view(), name="teacher_profile"),
    path("api-auth/", include("rest_framework.urls")),
    
    # clasrooms urls
    path("api/classroom/create", CreateClassroomView.as_view(), name="create_classroom"),

    
    
    
]
