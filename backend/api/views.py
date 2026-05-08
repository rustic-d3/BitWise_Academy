from django.shortcuts import render

from .permissions import IsAdmin, IsParent, IsTeacher
from .models import ChildProfile, Lesson, User
from rest_framework import generics
from rest_framework.generics import RetrieveAPIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import (
    ChildProfileSerializer,
    ClassroomSerializer,
    LessonJoinSerializer,
    ParentProfileSerializer,
    TeacherProfileSerializer,
    UserSerializer,
)


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class TeacherProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsAuthenticated, IsTeacher]

    def get_object(self):
        return self.request.user.teacher_profile


class ParentProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ParentProfileSerializer
    permission_classes = [IsAuthenticated, IsParent]

    def get_object(self):
        return self.request.user.parent_profile


class ChildProfileView(generics.RetrieveAPIView):
    serializer_class = ChildProfileSerializer
    permission_classes = [IsAuthenticated]
    queryset = ChildProfile.objects.all()
    lookup_field = "id"


class CreateClassroomView(generics.CreateAPIView):
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def perform_create(self, serializer):
        serializer.save()


class LessonJoinView(RetrieveAPIView):
    queryset = Lesson.objects.all()
    serializer_class = LessonJoinSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

@api_view(["POST"])
@permission_classes([IsAuthenticated])  
def close_channel(request, lesson_id):
    try:
        lesson = Lesson.objects.get(id=lesson_id)
    except Lesson.DoesNotExist:
        return Response({"error": "Lecția nu există."}, status=status.HTTP_404_NOT_FOUND)

    # Doar profesorul poate închide canalul
    user = request.user
    if str(user.role).lower() != "teacher":
        return Response({"status": "ok"}, status=status.HTTP_200_OK)

    lesson.channel_name = f"lesson_{lesson.id}_{lesson.classroom.id}"
    lesson.save()

    return Response({"status": "Canalul a fost închis."}, status=status.HTTP_200_OK)