from django.shortcuts import render
from django.shortcuts import get_object_or_404

from .permissions import IsAdmin, IsParent, IsTeacher
from .models import ChildProfile, Lesson, User
from rest_framework import generics
from rest_framework.generics import GenericAPIView, RetrieveAPIView
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

class ChildProfileCreateView(generics.CreateAPIView):
    queryset = ChildProfile.objects.all()
    serializer_class = ChildProfileSerializer
    permission_classes = [IsParent] 

    def perform_create(self, serializer):    
        parent = self.request.user.parent_profile 
        serializer.save(parent=parent)

class CreateClassroomView(generics.CreateAPIView):
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def perform_create(self, serializer):
        serializer.save()

class ChildProfileUpdateView(generics.UpdateAPIView):
    queryset = ChildProfile.objects.all()
    serializer_class = ChildProfileSerializer
    lookup_field = 'id'
    
class ChildDetailView(RetrieveAPIView):
    queryset = ChildProfile.objects.all()
    serializer_class = ChildProfileSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["child_id"] = self.kwargs.get("id")  # ← inject child id
        return context

class LessonJoinView(RetrieveAPIView):
    queryset = Lesson.objects.all()
    serializer_class = LessonJoinSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"
    
class LessonSkipView(GenericAPIView):
    queryset = Lesson.objects.all()
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

    def post(self, request, id):
        lesson = self.get_object()  
        child_id = request.data.get("child_id")

        if not child_id:
            return Response(
                {"detail": "child_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        child = get_object_or_404(
            ChildProfile,
            id=child_id,
            parent=request.user.parent_profile,
        )

        lesson.skipped_by.add(child)
        return Response({"detail": "Lesson skipped."}, status=status.HTTP_200_OK)
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