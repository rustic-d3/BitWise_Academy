from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import ChildProfile
from core.pdf import EmptyPdfError, extract_text
from core.permissions import IsAdmin, IsParent, IsTeacher

from . import scheduling
from .attendance import JoinResult, consume_credit_and_join
from .models import Lesson
from .pagination import LessonPagination
from .phone_calls import CallError, place_reminder_call
from .serializers import ClassroomSerializer, LessonJoinSerializer, LessonListSerializer


def get_own_child(request, child_id) -> ChildProfile:
    """The child with `child_id`, but only if it belongs to the requesting parent."""
    return get_object_or_404(ChildProfile, id=child_id, parent__user=request.user)


def missing_child_id() -> Response:
    return Response({"error": "ID-ul copilului lipsește."}, status=status.HTTP_400_BAD_REQUEST)


# --- Classrooms & lesson lists -----------------------------------------------


class ClassroomCreateView(generics.CreateAPIView):
    serializer_class = ClassroomSerializer
    permission_classes = [IsAdmin]


class TeacherLessonsView(generics.ListAPIView):
    serializer_class = LessonListSerializer
    permission_classes = [IsTeacher]
    pagination_class = LessonPagination

    def get_queryset(self):
        return (
            Lesson.objects.taught_by(self.request.user)
            .select_related("classroom")
            .prefetch_related("classroom__students", "makeup_students", "skipped_by")
            .order_by("date_time")
        )


class ChildLessonsView(generics.ListAPIView):
    """A child's calendar: their classroom's lessons plus the make-ups booked for them."""

    serializer_class = LessonListSerializer
    permission_classes = [IsParent]
    pagination_class = LessonPagination

    def get_queryset(self):
        child = get_own_child(self.request, self.kwargs["child_id"])
        if not child.classroom_id:
            return Lesson.objects.none()

        return (
            Lesson.objects.active()
            .filter(classroom_id=child.classroom_id)
            # Make-up lessons belong only to the children they were booked for.
            .filter(Q(is_makeup=False) | Q(makeup_students=child))
            .distinct()
            .select_related("classroom")
            .prefetch_related("classroom__students", "makeup_students", "skipped_by")
            .order_by("date_time")
        )


# --- Live lesson -------------------------------------------------------------


class LessonJoinView(generics.RetrieveAPIView):
    """Video/whiteboard credentials for a lesson the user is allowed to attend."""

    serializer_class = LessonJoinSerializer
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = "lesson_id"

    def get_queryset(self):
        return Lesson.objects.visible_to(self.request.user).select_related(
            "classroom__teacher__user"
        )


class ConsumeCreditView(APIView):
    permission_classes = [IsParent]

    def post(self, request, lesson_id):
        child_id = request.data.get("child_id")
        if not child_id:
            return missing_child_id()

        child = get_own_child(request, child_id)
        lesson = get_object_or_404(Lesson.objects.visible_to(request.user), id=lesson_id)
        result = consume_credit_and_join(lesson, child)

        if result is JoinResult.NO_CREDITS:
            return Response(
                {"error": "Nu ai suficiente credite pentru a intra la această oră."},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )
        message = (
            "Acces deja deblocat. Te reconectăm!"
            if result is JoinResult.ALREADY_PRESENT
            else "Credit consumat. Acces permis!"
        )
        return Response({"message": message}, status=status.HTTP_200_OK)


class MarkAttendanceView(APIView):
    permission_classes = [IsParent]

    def post(self, request, lesson_id):
        child_id = request.data.get("child_id")
        if not child_id:
            return missing_child_id()

        child = get_own_child(request, child_id)
        lesson = get_object_or_404(Lesson.objects.visible_to(request.user), id=lesson_id)
        lesson.present_students.add(child)  # no-op if already present
        return Response({"message": "Prezență marcată cu succes!"}, status=status.HTTP_200_OK)


class CallParentView(APIView):
    """Teacher rings the parent of a child who hasn't joined yet."""

    permission_classes = [IsTeacher]

    def post(self, request, lesson_id, child_id):
        lesson = get_object_or_404(Lesson.objects.taught_by(request.user), id=lesson_id)
        child = get_object_or_404(ChildProfile.objects.select_related("parent__user"), id=child_id)

        if lesson.present_students.filter(pk=child.pk).exists():
            return Response({"error": "Copilul este deja la lecție!"}, status=400)

        try:
            call = place_reminder_call(child.parent.user.phone_number)
        except CallError as exc:
            body = {"success": False, "error": exc.message}
            if exc.twilio_code:
                body["twilio_code"] = exc.twilio_code
            return Response(body, status=status.HTTP_400_BAD_REQUEST)

        return Response({"success": True, **call}, status=status.HTTP_200_OK)


class CloseChannelView(APIView):
    """Called when someone leaves the call; only the teacher leaving resets the channel."""

    permission_classes = [IsAuthenticated]

    def post(self, request, lesson_id):
        lesson = get_object_or_404(Lesson.objects.visible_to(request.user), id=lesson_id)
        if not request.user.is_teacher:
            return Response({"status": "ok"}, status=status.HTTP_200_OK)

        lesson.restore_channel()
        return Response({"status": "Canalul a fost închis."}, status=status.HTTP_200_OK)


# --- Lesson management -------------------------------------------------------


class LessonCancelView(APIView):
    permission_classes = [IsTeacher]

    def delete(self, request, lesson_id):
        lesson = get_object_or_404(Lesson.objects.taught_by(request.user), id=lesson_id)
        scheduling.reschedule_at_end_of_course(lesson)
        return Response(
            {
                "message": "Lecția a fost anulată și o nouă sesiune a fost adăugată la finalul cursului."
            },
            status=status.HTTP_200_OK,
        )


class LessonSkipView(APIView):
    permission_classes = [IsParent]

    def post(self, request, lesson_id):
        child_id = request.data.get("child_id")
        if not child_id:
            return Response({"detail": "child_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        child = get_own_child(request, child_id)
        lesson = get_object_or_404(Lesson.objects.visible_to(request.user), id=lesson_id)
        lesson.skipped_by.add(child)
        return Response({"detail": "Lesson skipped."}, status=status.HTTP_200_OK)


class MakeupLessonCreateView(APIView):
    permission_classes = [IsParent]

    def post(self, request):
        child_id = request.data.get("child_id")
        if not child_id:
            return missing_child_id()

        child = get_own_child(request, child_id)
        try:
            scheduling.schedule_makeup_lesson(
                child, request.data.get("date"), request.data.get("time")
            )
        except scheduling.SchedulingError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"message": "Recuperarea a fost programată!"}, status=status.HTTP_201_CREATED
        )


class LessonMaterialUploadView(APIView):
    """Teacher uploads the lesson PDF; its text feeds the quiz, the reports and Glitch."""

    permission_classes = [IsTeacher]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, lesson_id):
        pdf_file = request.FILES.get("file")
        if not pdf_file:
            return Response({"error": "Fișierul lipsește."}, status=status.HTTP_400_BAD_REQUEST)

        lesson = get_object_or_404(Lesson.objects.taught_by(request.user), id=lesson_id)
        try:
            lesson.lesson_material_text = extract_text(pdf_file)
        except EmptyPdfError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        lesson.save(update_fields=["lesson_material_text"])
        return Response(
            {"message": "Material încărcat cu succes!", "lesson_id": lesson.id},
            status=status.HTTP_201_CREATED,
        )
