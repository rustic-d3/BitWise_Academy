import logging

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from classrooms.models import Lesson

from . import glitch

logger = logging.getLogger(__name__)


class GlitchChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        lesson_id = request.data.get("lesson_id")
        message = request.data.get("message")
        history = request.data.get("history") or []

        if not lesson_id or not message:
            return Response(
                {"error": "Lipsesc datele necesare."}, status=status.HTTP_400_BAD_REQUEST
            )

        lesson = get_object_or_404(Lesson.objects.visible_to(request.user), id=lesson_id)
        try:
            answer = glitch.reply(lesson.lesson_material_text, history, message)
        except Exception:
            logger.exception("Gemini chat failed for lesson %s", lesson_id)
            return Response(
                {"error": "Glitch are probleme tehnice momentan."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({"reply": answer}, status=status.HTTP_200_OK)
