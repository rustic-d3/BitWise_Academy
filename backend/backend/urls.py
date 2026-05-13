
from django.contrib import admin
from django.urls import path, include
from api.views import  ChildProfileCreateView, ChildProfileUpdateView, ChildProfileView, CreateUserView, LessonJoinView, LessonSkipView, TeacherProfileView,ParentProfileView, CreateClassroomView, close_channel
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
    path('api/children/add/', ChildProfileCreateView.as_view(), name='child-add'),
    path("api/child/<int:id>/", ChildProfileView.as_view(), name="child_profile"),
    path('api/child/<int:id>/update/', ChildProfileUpdateView.as_view(), name='child_update'),
    # clasrooms urls
    path("api/classroom/create", CreateClassroomView.as_view(), name="create_classroom"),
    path('api/lessons/<int:id>/join/', LessonJoinView.as_view(), name='lesson_join'),
    path("lessons/<int:id>/skip/", LessonSkipView.as_view(), name="lesson-skip"),
    path("api/lessons/<int:lesson_id>/close-channel/", close_channel, name="close_channel"),

    
    
    
]
