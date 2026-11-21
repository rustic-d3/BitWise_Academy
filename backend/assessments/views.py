from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import ChildProfile
from classrooms.models import Lesson
from core.pdf import EmptyPdfError, extract_text
from core.permissions import IsParent, IsTeacher

from .models import TestResult
from .quiz import InvalidQuizError, generate_quiz, grade
from .reports import dispatch_lesson_reports


class QuizGenerateView(APIView):
    """Teacher uploads a PDF; Gemini turns it into a multiple-choice quiz."""

    permission_classes = [IsTeacher]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, lesson_id):
        pdf_file = request.FILES.get("file")
        if not pdf_file:
            return Response({"error": "Fișierul lipsește."}, status=status.HTTP_400_BAD_REQUEST)

        lesson = get_object_or_404(Lesson.objects.taught_by(request.user), id=lesson_id)
        try:
            quiz = generate_quiz(extract_text(pdf_file))
        except EmptyPdfError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except InvalidQuizError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        lesson.generated_test = quiz
        lesson.save(update_fields=["generated_test"])
        return Response(
            {"message": "Test generat și salvat cu succes!", "lesson_id": lesson.id, "test": quiz},
            status=status.HTTP_201_CREATED,
        )


class QuizStartView(APIView):
    permission_classes = [IsTeacher]

    def post(self, request, lesson_id):
        lesson = get_object_or_404(Lesson.objects.taught_by(request.user), id=lesson_id)

        if not lesson.generated_test:
            return Response(
                {
                    "error": "Nu poți porni testul pentru că nu a fost încărcat sau generat niciun test pentru această lecție!"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not lesson.present_students.exists():
            return Response(
                {"error": "Nu se poate începe testul. Niciun elev nu este prezent la oră!"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        lesson.is_test_active = True
        lesson.save(update_fields=["is_test_active"])
        return Response({"message": "Testul a început!"}, status=status.HTTP_200_OK)


class QuizStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, lesson_id):
        lesson = get_object_or_404(Lesson.objects.visible_to(request.user), id=lesson_id)
        return Response({"is_test_active": lesson.is_test_active}, status=status.HTTP_200_OK)


class QuizQuestionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, lesson_id):
        lesson = get_object_or_404(Lesson.objects.visible_to(request.user), id=lesson_id)
        if not lesson.is_test_active:
            return Response({"error": "Testul nu a început încă."}, status=status.HTTP_403_FORBIDDEN)

        questions = lesson.generated_test or []
        if not request.user.is_teacher:
            # Students get the questions, never the answer key.
            questions = [
                {k: v for k, v in q.items() if k != "correct_answer"} for q in questions
            ]
        return Response({"test_data": questions}, status=status.HTTP_200_OK)


class QuizSubmitView(APIView):
    permission_classes = [IsParent]

    def post(self, request, lesson_id):
        lesson = get_object_or_404(Lesson.objects.visible_to(request.user), id=lesson_id)
        child = get_object_or_404(
            ChildProfile, id=request.data.get("child_id"), parent__user=request.user
        )
        answers = request.data.get("answers") or {}
        if not isinstance(answers, dict):
            return Response({"error": "Răspunsurile sunt invalide."}, status=status.HTTP_400_BAD_REQUEST)
        if not lesson.generated_test:
            return Response(
                {"error": "Acest test nu are întrebări generate."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = grade(lesson.generated_test, answers)
        TestResult.objects.update_or_create(
            lesson=lesson,
            child=child,
            defaults={"child_answer": answers, "score": result.score},
        )

        # Close the quiz once every present child has submitted.
        present = lesson.present_students.count()
        if present and lesson.test_results.count() >= present:
            lesson.is_test_active = False
            lesson.save(update_fields=["is_test_active"])

        return Response(
            {
                "message": "Test salvat cu succes!",
                "score": result.score,
                "correct_answers": result.correct,
                "total_questions": result.total,
                "is_test_active": lesson.is_test_active,
            },
            status=status.HTTP_201_CREATED,
        )


class EndLessonView(APIView):
    """Teacher ends the lesson: the channel closes and parents get AI reports by email."""

    permission_classes = [IsTeacher]

    def post(self, request, lesson_id):
        lesson = get_object_or_404(Lesson.objects.taught_by(request.user), id=lesson_id)
        lesson.close_channel()
        dispatch_lesson_reports(lesson)
        return Response(
            {"message": "Lecția s-a încheiat cu succes. Rapoartele AI se generează în fundal!"},
            status=status.HTTP_200_OK,
        )
