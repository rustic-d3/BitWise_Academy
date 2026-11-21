from django.urls import path

from . import views

urlpatterns = [
    path("classroom/create", views.ClassroomCreateView.as_view(), name="classroom-create"),
    path("teacher/get_lessons/", views.TeacherLessonsView.as_view(), name="teacher-lessons"),
    path("child/<int:child_id>/lessons/", views.ChildLessonsView.as_view(), name="child-lessons"),
    path("lessons/create-recovery", views.MakeupLessonCreateView.as_view(), name="makeup-create"),
    # A single lesson
    path("lessons/<int:lesson_id>/join/", views.LessonJoinView.as_view(), name="lesson-join"),
    path(
        "lessons/<int:lesson_id>/consume-credit/",
        views.ConsumeCreditView.as_view(),
        name="lesson-consume-credit",
    ),
    path(
        "lessons/<int:lesson_id>/mark-attendance/",
        views.MarkAttendanceView.as_view(),
        name="lesson-mark-attendance",
    ),
    path("lessons/<int:lesson_id>/skip/", views.LessonSkipView.as_view(), name="lesson-skip"),
    path(
        "lessons/<int:lesson_id>/cancel-lesson",
        views.LessonCancelView.as_view(),
        name="lesson-cancel",
    ),
    path(
        "lessons/<int:lesson_id>/call/<int:child_id>/",
        views.CallParentView.as_view(),
        name="lesson-call-parent",
    ),
    path(
        "lessons/<int:lesson_id>/close-channel/",
        views.CloseChannelView.as_view(),
        name="lesson-close-channel",
    ),
    path(
        "lessons/<int:lesson_id>/upload-material/",
        views.LessonMaterialUploadView.as_view(),
        name="lesson-upload-material",
    ),
]
