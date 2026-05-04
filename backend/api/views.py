from django.shortcuts import render
from .models import User
from rest_framework import generics
from .serializers import ClassroomSerializer, TeacherProfileSerializer, UserSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated

# Crea te your views here.
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    
#  TeacherProfile Views
class TeacherProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.teacher_profile
    
# ParentProfile Views


#Classroom Views

class CreateClassroomView(generics.CreateAPIView):
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user.teacher_profile)