from django.urls import path

from . import views

urlpatterns = [
    path(
        "lessons/<int:lesson_id>/upload-test/",
        views.QuizGenerateView.as_view(),
        name="quiz-generate",
    ),
    path("lessons/<int:lesson_id>/start-test/", views.QuizStartView.as_view(), name="quiz-start"),
    path(
        "lessons/<int:lesson_id>/test-status/", views.QuizStatusView.as_view(), name="quiz-status"
    ),
    path(
        "lessons/<int:lesson_id>/test-questions/",
        views.QuizQuestionsView.as_view(),
        name="quiz-questions",
    ),
    path(
        "lessons/<int:lesson_id>/submit-test/", views.QuizSubmitView.as_view(), name="quiz-submit"
    ),
    path(
        "lessons/<int:lesson_id>/end-and-report/",
        views.EndLessonView.as_view(),
        name="lesson-end-and-report",
    ),
]
