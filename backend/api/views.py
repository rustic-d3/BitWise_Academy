import json
import os

from django.shortcuts import render
from django.shortcuts import get_object_or_404
import fitz
from google import genai

from .permissions import IsAdmin, IsParent, IsTeacher
from .models import ChildProfile, Lesson, User
from rest_framework import generics
from rest_framework.generics import DestroyAPIView, GenericAPIView, RetrieveAPIView
from rest_framework.decorators import  api_view, permission_classes
from rest_framework.views import APIView  
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from .serializers import (
    ChildProfileSerializer,
    ClassroomSerializer,
    LessonJoinSerializer,
    LessonSerializer,
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

class LessonDeleteView(DestroyAPIView):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
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



#Tests views  

class CreateTestView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, lesson_id):
        pdf_file = request.FILES.get('file')
        if not pdf_file:
            return Response({"error": "Fișierul lipsește."}, status=400)

        try:
            text_extras = ""
            
            with fitz.open(stream=pdf_file.read(), filetype="pdf") as doc:
                for pagina in doc:
                    text_extras += pagina.get_text()

            if not text_extras.strip():
                return Response({"error": "PDF-ul pare să fie gol sau scanat ca imagine."}, status=400)

            client = genai.Client()

            prompt = f"""
            Analizează următorul text dintr-un material didactic și generează un test grilă cu 10 întrebări.
            Răspunsul tău trebuie să fie EXCLUSIV un cod JSON valid, fără alte explicații.
            Formatul JSON trebuie să fie o listă de obiecte cu structura:
            [
              {{
                "question": "textul întrebării",
                "options": ["varianta A", "varianta B", "varianta C", "varianta D"],
                "correct_answer": "varianta exactă din listă"
              }}
            ]
            
            Text: {text_extras[:10000]}  # Limităm la primele 10k caractere pentru siguranță
            Limba în care generezi testul, trebuie să fie în conformitate cu limba din datele de intrare.
            """
            

            interaction = client.interactions.create(
                model="gemini-3-flash-preview",
                input=prompt,
            )
            
            raw_text = interaction.steps[-1].content[0].text
            print(raw_text)
            json_text = raw_text.replace('```json', '').replace('```', '').strip()
            test_data = json.loads(json_text)
            try:
                
                lesson = Lesson.objects.get(id=lesson_id)
                
                
                lesson.generated_test = test_data
                lesson.save()

                return Response({
                    "message": "Test generat și salvat cu succes!",
                    "lesson_id": lesson.id,
                    "test": lesson.generated_test
                }, status=201)

            except Lesson.DoesNotExist:
                return Response({"error": "Lecția nu a fost găsită."}, status=404)

        except json.JSONDecodeError:
            return Response({"error": "AI-ul a returnat un format invalid."}, status=500)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

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