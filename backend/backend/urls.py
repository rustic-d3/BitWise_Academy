
from django.contrib import admin
from django.urls import path, include
from api.views import ChildProfileView, CreateUserView, TeacherProfileView,ParentProfileView, CreateClassroomView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    #authentication process urls
    path('api/user/register/', CreateUserView.as_view(), name='register'),
    path("api/token/", TokenObtainPairView.as_view(), name='token'),
    path("api/token/refresh", TokenRefreshView.as_view(), name='refresh'),
    path("api-auth/", include("rest_framework.urls")),
    # teacher urls
    path("api/teacher/profile", TeacherProfileView.as_view(), name="teacher_profile"),
    
    #parent urls
    path("api/parent/profile", ParentProfileView.as_view(), name="parent_profile"),
    #child urls
    path("api/child/<int:id>/", ChildProfileView.as_view(), name="child_profile"),
    # clasrooms urls
    path("api/classroom/create", CreateClassroomView.as_view(), name="create_classroom"),

    
    
    
]
