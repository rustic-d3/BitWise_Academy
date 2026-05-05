from django.shortcuts import render

from .permissions import IsAdmin, IsParent, IsTeacher
from .models import ChildProfile, User
from rest_framework import generics
from .serializers import ChildProfileSerializer, ClassroomSerializer, ParentProfileSerializer, TeacherProfileSerializer, UserSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated

# Crea te your views here.
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    
#  TeacherProfile Views
class TeacherProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsAuthenticated, IsTeacher]

    def get_object(self):
        return self.request.user.teacher_profile
    
# ParentProfile Views

class ParentProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ParentProfileSerializer
    permission_classes = [IsAuthenticated, IsParent]
    def get_object(self):
        return self.request.user.parent_profile

#ChildProfile Views
# views.py
class ChildProfileView(generics.RetrieveAPIView):
    serializer_class = ChildProfileSerializer
    permission_classes = [IsAuthenticated]
    queryset = ChildProfile.objects.all()
    lookup_field = "id"


#Classroom Views

class CreateClassroomView(generics.CreateAPIView):
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def perform_create(self, serializer):
        serializer.save()