from datetime import timedelta
import json
import pdfplumber
from django.db import transaction
from django.shortcuts import render
from django.shortcuts import get_object_or_404
from google import genai
from django.core.mail import send_mail
import threading

from .permissions import IsAdmin, IsParent, IsTeacher
from .models import ChildProfile, Lesson, TestResult, User
from rest_framework import generics
from rest_framework.generics import DestroyAPIView, GenericAPIView, RetrieveAPIView
from rest_framework.decorators import  api_view, permission_classes
from rest_framework.views import APIView  
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, settings

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

class MarkAttendanceView(APIView):
    def post(self, request, lesson_id):
        child_id = request.data.get('child_id')
        
        if not child_id:
            return Response({"error": "ID-ul copilului lipsește."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lesson = Lesson.objects.get(id=lesson_id)
            child = ChildProfile.objects.get(id=child_id)
            
            lesson.present_students.add(child)
            # daca copilul a marcat prezenta deja, nu se va mai modifica de 2 ori baza de date.
            
            return Response({"message": "Prezență marcată cu succes!"}, status=status.HTTP_200_OK)
            
        except Lesson.DoesNotExist:
            return Response({"error": "Lecția nu a fost găsită."}, status=status.HTTP_404_NOT_FOUND)
        except ChildProfile.DoesNotExist:
            return Response({"error": "Copilul nu a fost găsit."}, status=status.HTTP_404_NOT_FOUND)

class LessonJoinView(RetrieveAPIView):
    queryset = Lesson.objects.all()
    serializer_class = LessonJoinSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

class LessonDeleteView(APIView):
    def delete(self, request, id): 
        try:
            lesson = Lesson.objects.get(id=id)
            classroom = lesson.classroom
            
            ultima_lectie = classroom.lessons.order_by('-date_time').first()
            
            if ultima_lectie:
                noua_data = ultima_lectie.date_time + timedelta(days=7)
            else:
                noua_data = lesson.date_time + timedelta(days=7)
            
            lesson.cancel_and_reschedule(noua_data)
            
            return Response(
                {"message": "Lecția a fost anulată și o nouă sesiune a fost adăugată la finalul cursului."}, 
                status=status.HTTP_200_OK
            )
            
        except Lesson.DoesNotExist:
            return Response({"error": "Lecția nu a fost găsită."}, status=status.HTTP_404_NOT_FOUND)
    
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

class LoadLessonMaterial(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, lesson_id):
        pdf_file = request.FILES.get('file')
        if not pdf_file:
            return Response({"error": "Fișierul lipsește."}, status=400)

        try:
            text_extras = ""
            
            with pdfplumber.open(pdf_file) as pdf:
                for page in pdf.pages:
                    text_extras += page.extract_text() or ""

            if not text_extras.strip():
                return Response({"error": "PDF-ul pare să fie gol sau scanat ca imagine."}, status=400)

            
            try:
                
                lesson = Lesson.objects.get(id=lesson_id)
                
                
                lesson.lesson_material_text = text_extras
                lesson.save()

                return Response({
                    "message": "Material încărcat cu succes!",
                    "lesson_id": lesson.id,
                }, status=201)

            except Lesson.DoesNotExist:
                return Response({"error": "Lecția nu a fost găsită."}, status=404)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

class ConsumeCreditView(APIView):
    def post(self, request, lesson_id):
        child_id = request.data.get('child_id')
        
        try:
            with transaction.atomic():
                lesson = Lesson.objects.get(id=lesson_id)
                child = ChildProfile.objects.select_for_update().get(id=child_id)
                
                if child in lesson.present_students.all():
                    return Response(
                        {"message": "Acces deja deblocat. Te reconectăm!"}, 
                        status=status.HTTP_200_OK
                    )

                if child.credits <= 0:
                    return Response(
                        {"error": "Nu ai suficiente credite pentru a intra la această oră."}, 
                        status=status.HTTP_402_PAYMENT_REQUIRED
                    )
                
                child.credits -= 1
                child.save()
                
                
                lesson.present_students.add(child)
                
                return Response({"message": "Credit consumat. Acces permis!"}, status=status.HTTP_200_OK)
                
        except Lesson.DoesNotExist:
            return Response({"error": "Lecția nu a fost găsită."}, status=404)
        except ChildProfile.DoesNotExist:
            return Response({"error": "Copilul nu a fost găsit."}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

#Tests views  

class CreateTestView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, lesson_id):
        pdf_file = request.FILES.get('file')
        if not pdf_file:
            return Response({"error": "Fișierul lipsește."}, status=400)

        try:
            text_extras = ""
            
            with pdfplumber.open(pdf_file) as pdf:
                for page in pdf.pages:
                    text_extras += page.extract_text() or ""

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

class StartTestView(APIView):
    def post(self, request, lesson_id):
        try:
            lesson = Lesson.objects.get(id=lesson_id)
            lesson.is_test_active = True
            lesson.save()
            
            if not lesson.generated_test:
                return Response(
                    {"error": "Nu poți porni testul pentru că nu a fost încărcat sau generat niciun test pentru această lecție!"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if lesson.present_students.count() == 0:
                return Response(
                    {"error": "Nu se poate începe testul. Niciun elev nu este prezent la oră!"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({"message": "Testul a început!"}, status=status.HTTP_200_OK)
        except Lesson.DoesNotExist:
            return Response({"error": "Lecția nu a fost găsită."}, status=status.HTTP_404_NOT_FOUND)

class TestStatusView(APIView):
    def get(self, request, lesson_id):
        try:
            lesson = Lesson.objects.only('is_test_active').get(id=lesson_id)
            return Response({
                "is_test_active": lesson.is_test_active
            }, status=status.HTTP_200_OK)
            
        except Lesson.DoesNotExist:
            return Response({"error": "Lecția nu a fost găsită."}, status=status.HTTP_404_NOT_FOUND)

class GetTestQuestionsView(APIView):
    def get(self, request, lesson_id):
        try:
            lesson = Lesson.objects.only('generated_test', 'is_test_active').get(id=lesson_id)
            
            if not lesson.is_test_active:
                return Response({"error": "Testul nu a început încă."}, status=403)
                
            return Response({
                "test_data": lesson.generated_test
            }, status=status.HTTP_200_OK)
            
        except Lesson.DoesNotExist:
            return Response({"error": "Lecția nu a fost găsită."}, status=status.HTTP_404_NOT_FOUND)

class SubmitTestView(APIView):
    def post(self, request, lesson_id):
        try:
            lesson = Lesson.objects.get(id=lesson_id)
            
            child_id = request.data.get('child_id')
            child_answers = request.data.get('answers', {}) # Punem un default {} ca să nu crape dacă e gol
            
            try:
                child = ChildProfile.objects.get(id=child_id)
            except ChildProfile.DoesNotExist:
                return Response({"error": "Copilul nu a fost găsit."}, status=404)

            ai_test = lesson.generated_test 
            if not ai_test:
                return Response({"error": "Acest test nu are întrebări generate."}, status=400)

            total_questions = len(ai_test)
            correct_answers_count = 0
            
            for index_str, answer in child_answers.items():
                index = int(index_str)
                if index < total_questions and answer == ai_test[index].get("correct_answer"):
                    correct_answers_count += 1
                    
            score = (correct_answers_count / total_questions) * 100 if total_questions > 0 else 0

            TestResult.objects.create(
                lesson=lesson,
                child=child,
                child_answer=child_answers,
                score=score
            )
            
            present_count = lesson.present_students.count()
            results_count = TestResult.objects.filter(lesson=lesson).count()
            
            if results_count >= present_count and present_count > 0:
                lesson.is_test_active = False
                lesson.save()

            return Response({
                "message": "Test salvat cu succes!",
                "score": score,
                "correct_answers": correct_answers_count,
                "total_questions": total_questions,
                "is_test_active": lesson.is_test_active # Îi spunem frontend-ului starea actuală
            }, status=status.HTTP_201_CREATED)

        except Lesson.DoesNotExist:
            return Response({"error": "Lecția nu a fost găsită."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime
from .models import Classroom, TeacherAvailability

class TeacherScheduleView(APIView):
    permission_classes = [IsAuthenticated, IsTeacher]

    def post(self, request, *args, **kwargs):
        user = request.user
        
        
        teacher_profile = user.teacher_profile
        new_schedule = request.data.get('schedule', [])

        day_mapping = {
            "Luni": "Mon", "Marți": "Tue", "Miercuri": "Wed", 
            "Joi": "Thu", "Vineri": "Fri", "Sâmbătă": "Sat", "Duminică": "Sun"
        }

        parsed_availabilities = []

        for row in new_schedule:
            day_ro = row.get('day')
            start_time_str = row.get('startTime')
            end_time_str = row.get('endTime')

            if not day_ro or not start_time_str or not end_time_str:
                continue 

            db_day = day_mapping.get(day_ro)
            if not db_day:
                return Response({"error": f"Zi invalidă trimisă din frontend: {day_ro}"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                 start_time = datetime.strptime(start_time_str, '%H:%M').time()
                 end_time = datetime.strptime(end_time_str, '%H:%M').time()
            except ValueError:
                 return Response({"error": "Formatul orei este invalid."}, status=status.HTTP_400_BAD_REQUEST)
            
            if start_time >= end_time:
                return Response({"error": f"Ora de început trebuie să fie înaintea orei de sfârșit pentru ziua de {day_ro}."}, status=status.HTTP_400_BAD_REQUEST)

            parsed_availabilities.append({
                'day': db_day,
                'day_ro': day_ro,
                'start_time': start_time,
                'end_time': end_time
            })

        existing_classrooms = Classroom.objects.filter(
            teacher=teacher_profile,
            is_canceled=False
        )

        for avail in parsed_availabilities:
            a_day = avail['day']
            a_start = avail['start_time']
            a_end = avail['end_time']

            for classroom in existing_classrooms:
                if classroom.schedule_day == a_day:
                    c_start = classroom.schedule_time
                    
                    
                    if a_start <= c_start < a_end:
                        zi_ro = avail['day_ro']
                        return Response({
                            "error": f"Atenție: Nu poți seta recuperări {zi_ro} între {a_start.strftime('%H:%M')} și {a_end.strftime('%H:%M')}, deoarece ai deja o grupă normală programată la ora {c_start.strftime('%H:%M')}!"
                        }, status=status.HTTP_409_CONFLICT)

        
        TeacherAvailability.objects.filter(teacher=teacher_profile).delete()

        
        availabilities_to_create = [
            TeacherAvailability(
                teacher=teacher_profile,
                day=item['day'],
                start_time=item['start_time'],
                end_time=item['end_time']
            ) for item in parsed_availabilities
        ]
        
        TeacherAvailability.objects.bulk_create(availabilities_to_create)

        return Response(
            {"message": "Programul a fost salvat cu succes!"}, 
            status=status.HTTP_200_OK
        )
        
 
def trimite_raport_async(lesson, child, parent_email, ai_test):
    try:
        test_result = TestResult.objects.filter(lesson=lesson, child=child).first()
        lesson_material = lesson.lesson_material_text or "Nu există suport de curs!"
        scor = test_result.score if test_result else 0
        raspunsuri = test_result.child_answer if test_result else {}
        
        greseli = []
        if test_result and ai_test:
            for index_str, answer in raspunsuri.items():
                index = int(index_str)
                if index < len(ai_test) and answer != ai_test[index].get("correct_answer"):
                    greseli.append({
                        "intrebare": ai_test[index].get("question"),
                        "raspuns_corect": ai_test[index].get("correct_answer"),
                        "raspunsul_lui": answer
                    })

        # Generarea analizei cu Gemini
        client = genai.Client()
        if test_result and ai_test:
            prompt = f"""
            Ești un asistent educațional profesionist și prietenos.
            Scrie un email scurt (maxim 3 paragrafe) către un părinte.
            Nume copil: {child.full_name}.
            Profesor copil: {lesson.classroom.teacher.user.last_name} {lesson.classroom.teacher.user.first_name}
            Data și titlul lecției: {lesson.classroom.titlu} - {lesson.date_time}.
            Scor la testul de final: {scor}%.
            Greșeli făcute de copil (dacă există): {greseli}.
            
            Te rog să fii încurajator. Menționează pe scurt despre ce a fost lecția (informații aici: {lesson_material[:2000]}). 
            Dacă a făcut greșeli, sugerează-i părintelui un sfat practic și simplu.
            Dacă a luat 100%, felicită-l!
            Semnează cu 'Echipa Educațională Bitwise Academy'.
            """
        else:
            prompt = f"""
            Ești un asistent educațional profesionist și prietenos.
            Scrie un email scurt (maxim 3 paragrafe) către un părinte.
            Nume copil: {child.full_name}.
            Profesor copil: {lesson.classroom.teacher.user.last_name} {lesson.classroom.teacher.user.first_name}
            Data și titlul lecției: {lesson.classroom.titlu} - {lesson.date_time}.
            
            Te rog să fii încurajator. Menționează pe scurt despre ce a fost lecția, extrăgând ideile principale din acest text suport:
            {lesson_material[:3000]} # Limităm la 3000 caractere să nu depășim limitele AI-ului inutil
            
            Felicită copilul pentru participarea activă la oră!
            Semnează cu 'Echipa Educațională Bitwise Academy'.
            """
            
        
        interaction = client.interactions.create(
            model="gemini-3-flash-preview", # Sau modelul pe care îl folosești deja
            input=prompt,
        )
        mesaj_email = interaction.steps[-1].content[0].text

        # Trimite email-ul
        send_mail(
            subject=f"Raport Lecție: {lesson.classroom.titlu} - {child.full_name}",
            message=mesaj_email,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[parent_email],
            fail_silently=False,
        )
        print(f"Raport trimis cu succes către {parent_email}")
        
    except Exception as e:
        print(f"Eroare la generarea raportului pentru {child.full_name}: {e}") 
        
        
class EndAndReportView(APIView):
    permission_classes = [IsAuthenticated, IsTeacher]

    def post(self, request, lesson_id):
        try:
            lesson = Lesson.objects.get(id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({"error": "Lecția nu a fost găsită."}, status=status.HTTP_404_NOT_FOUND)

        # Măsură de siguranță: doar profesorul are voie să apese acest buton
        if str(request.user.role).lower() != "teacher":
            return Response({"error": "Doar profesorul poate încheia lecția."}, status=status.HTTP_403_FORBIDDEN)

        # 1. inchid canalul oficial 
        lesson.channel_name = f"lesson_{lesson.id}_closed"
        lesson.save()

        # 2. pregatirea datelor
        ai_test = lesson.generated_test
        elevi_prezenti = lesson.present_students.all()

        # 3. Declanșăm asincronitatea (Threads)
        for child in elevi_prezenti:
            parent_email = child.parent.user.email
            if parent_email:
                # Se creaza un thred pentru fiecare email
                thread = threading.Thread(
                    target=trimite_raport_async,
                    args=(lesson, child, parent_email, ai_test)
                )
                thread.start() # Îi dăm ordinul de start

        # 4. raspuns instantaneu fronendului
        return Response(
            {"message": "Lecția s-a încheiat cu succes. Rapoartele AI se generează în fundal!"},
            status=status.HTTP_200_OK
        )
        
            
@api_view(["POST"])
@permission_classes([IsAuthenticated])  

def close_channel(request, lesson_id):
    try:
        lesson = Lesson.objects.get(id=lesson_id)
    except Lesson.DoesNotExist:
        return Response({"error": "Lecția nu există."}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if str(user.role).lower() != "teacher":
        return Response({"status": "ok"}, status=status.HTTP_200_OK)

    lesson.channel_name = f"lesson_{lesson.id}_{lesson.classroom.id}"
    lesson.save()

    return Response({"status": "Canalul a fost închis."}, status=status.HTTP_200_OK)