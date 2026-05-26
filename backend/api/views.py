from datetime import timedelta
import json
import pdfplumber
from django.db import transaction
from django.shortcuts import render
from django.shortcuts import get_object_or_404
from google import genai
from django.db.models import Q

from django.core.mail import send_mail
import threading
from django.utils.timezone import make_aware
from django.utils.encoding import force_bytes, force_str
import os
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
import phonenumbers

from api.pagination import LessonPagination

from .supabase_client import upload_profile_picture

from .permissions import IsAdmin, IsParent, IsTeacher
from .models import ChildProfile, Lesson, TestResult, User
from rest_framework import generics
from rest_framework.generics import DestroyAPIView, GenericAPIView, RetrieveAPIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, settings
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime
from .models import Classroom, TeacherAvailability
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator

from .serializers import (
    ChildProfileSerializer,
    ClassroomSerializer,
    LessonJoinSerializer,
    LessonSerializer,
    PaginatedLessonSerializer,
    ParentProfileSerializer,
    TeacherProfileSerializer,
    UserSerializer,
)


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class UserProfilePicture(APIView):
    def get(self, request):
        user = self.request.user

        if user.role == "TEACHER":
            teacher_profile = user.teacher_profile or None
            if not teacher_profile.profile_picture:
                return Response(
                    {
                        "profile_picture": "https://upppanlybtkzquqxfapl.supabase.co/storage/v1/object/public/profile_avatars/no_avatar.png"
                    },
                    status=status.HTTP_200_OK,
                )

            return Response(
                {"profile_picture": {teacher_profile.profile_picture}},
                status=status.HTTP_200_OK,
            )

        if user.role == "PARENT":
            parent_profile = user.parent_profile or None
            if not parent_profile.profile_picture:
                return Response(
                    {
                        "profile_picture": "https://upppanlybtkzquqxfapl.supabase.co/storage/v1/object/public/profile_avatars/no_avatar.png"
                    },
                    status=status.HTTP_200_OK,
                )
            return Response(
                {"profile_picture": {parent_profile.profile_picture}},
                status=status.HTTP_200_OK,
            )
        return Response(
            {"error": "Poza de profil nu a putut fi extrasă."},
            status=status.HTTP_404_NOT_FOUND,
        )


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response(
                {"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)

            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

            token = default_token_generator.make_token(user)

            frontend_url = "http://localhost:5173"
            reset_link = f"{frontend_url}/reset-password/{uidb64}/{token}/"

            send_mail(
                subject="Cerere de resetare a parolei - Bitwise Academy",
                message=f"Salut {user.first_name},\n\nApasă pe link-ul de mai jos pentru a reseta parola:\n{reset_link}\n\nDacă nu ai cerut resetarea parolei, ignoră acest email.",
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=False,
            )

            return Response(
                {
                    "message": "If an account with that email exists, a reset link has been sent."
                },
                status=status.HTTP_200_OK,
            )

        except User.DoesNotExist:
            return Response(
                {
                    "message": "If an account with that email exists, a reset link has been sent."
                },
                status=status.HTTP_200_OK,
            )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        new_password = request.data.get("new_password")

        if not new_password:
            return Response(
                {"error": "New password is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)

            if not default_token_generator.check_token(user, token):
                return Response(
                    {"error": "The reset link is invalid or has expired."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.set_password(new_password)
            user.save()

            return Response(
                {"message": "Password has been successfully reset!"},
                status=status.HTTP_200_OK,
            )

        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST
            )


class TeacherProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsAuthenticated, IsTeacher]

    def get_object(self):
        return self.request.user.teacher_profile

    def update(self, request, *args, **kwargs):
        profile = self.get_object()

        # Poză
        picture = request.FILES.get("profile_picture")
        if picture:
            ext = picture.name.split(".")[-1]
            filename = f"teacher_{request.user.id}.{ext}"
            public_url = upload_profile_picture(picture, filename)
            profile.profile_picture = public_url

        # Câmpuri pe User
        email = request.data.get("email")
        phone = request.data.get("phone_number")
        password = request.data.get("password")

        if email:
            request.user.email = email
        if phone is not None:
            request.user.phone_number = phone  # ← mutat pe user
        if password:
            request.user.set_password(password)

        request.user.save()  # ← un singur save pentru User

        # Câmpuri pe Profile
        description = request.data.get("description")
        if description is not None:
            profile.description = description

        profile.save()  # ← un singur save pentru Profile

        return Response(
            TeacherProfileSerializer(profile).data, status=status.HTTP_200_OK
        )


class TeacherLessonsView(generics.ListAPIView):
    serializer_class = PaginatedLessonSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = LessonPagination

    def get_queryset(self):
        # Tragem lecțiile, clasa atașată și copiii din acea clasă dintr-un singur foc
        return (
            Lesson.objects.filter(classroom__teacher__user=self.request.user)
            .select_related("classroom")
            .prefetch_related("classroom__students", "makeup_students")
            .order_by("date_time")
        )


class ParentProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ParentProfileSerializer
    permission_classes = [IsAuthenticated, IsParent]

    def get_object(self):
        return self.request.user.parent_profile

    def update(self, request, *args, **kwargs):
        profile = self.get_object()

        # Poză

        picture = request.FILES.get("profile_picture")
        if picture:
            ext = picture.name.split(".")[-1]
            filename = f"parent_{request.user.id}.{ext}"
            public_url = upload_profile_picture(picture, filename)
            profile.profile_picture = public_url
            profile.save()

        # Email + phone — ambele pe User
        email = request.data.get("email")
        phone = request.data.get("phone_number")

        if email:
            request.user.email = email
        if phone is not None:
            request.user.phone_number = phone  # ← pe user, nu pe profile

        request.user.save()  # ← un singur save pentru toate câmpurile de pe User

        return Response(
            ParentProfileSerializer(profile).data, status=status.HTTP_200_OK
        )


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
    lookup_field = "id"


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
        child_id = request.data.get("child_id")

        if not child_id:
            return Response(
                {"error": "ID-ul copilului lipsește."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            lesson = Lesson.objects.get(id=lesson_id)
            child = ChildProfile.objects.get(id=child_id)

            lesson.present_students.add(child)
            # daca copilul a marcat prezenta deja, nu se va mai modifica de 2 ori baza de date.

            return Response(
                {"message": "Prezență marcată cu succes!"}, status=status.HTTP_200_OK
            )

        except Lesson.DoesNotExist:
            return Response(
                {"error": "Lecția nu a fost găsită."}, status=status.HTTP_404_NOT_FOUND
            )
        except ChildProfile.DoesNotExist:
            return Response(
                {"error": "Copilul nu a fost găsit."}, status=status.HTTP_404_NOT_FOUND
            )


class LessonJoinView(RetrieveAPIView):
    queryset = Lesson.objects.all()
    serializer_class = LessonJoinSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"


class ChildLessonsView(generics.ListAPIView):
    serializer_class = PaginatedLessonSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = LessonPagination

    def get_queryset(self):
        # 1. Extragem ID-ul copilului din URL
        child_id = self.kwargs["child_id"]

        try:
            # 2. Securitate: Găsim copilul doar dacă aparține părintelui autentificat
            child = ChildProfile.objects.get(
                id=child_id, parent__user=self.request.user
            )
        except ChildProfile.DoesNotExist:
            # Dacă copilul nu există sau nu e al lui, returnăm o listă goală
            return Lesson.objects.none()

        # 3. Dacă copilul nu este alocat încă unei clase, nu are lecții
        if not child.classroom:
            return Lesson.objects.none()

        # 4. Extragem lecțiile active ale clasei
        lessons = Lesson.objects.filter(classroom=child.classroom, is_canceled=False)

        # 5. Logica pentru recuperări: Excludem lecțiile de makeup unde copilul NU este în makeup_students
        lessons = lessons.exclude(Q(is_makeup=True) & ~Q(makeup_students=child))

        # 6. Optimizăm interogarea și ordonăm cronologic
        return (
            lessons.select_related("classroom")
            .prefetch_related("classroom__students", "makeup_students")
            .order_by("date_time")
        )


class LessonDeleteView(APIView):
    def delete(self, request, id):
        try:
            lesson = Lesson.objects.get(id=id)
            classroom = lesson.classroom

            ultima_lectie = classroom.lessons.order_by("-date_time").first()

            if ultima_lectie:
                noua_data = ultima_lectie.date_time + timedelta(days=7)
            else:
                noua_data = lesson.date_time + timedelta(days=7)

            lesson.cancel_and_reschedule(noua_data)

            return Response(
                {
                    "message": "Lecția a fost anulată și o nouă sesiune a fost adăugată la finalul cursului."
                },
                status=status.HTTP_200_OK,
            )

        except Lesson.DoesNotExist:
            return Response(
                {"error": "Lecția nu a fost găsită."}, status=status.HTTP_404_NOT_FOUND
            )


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
        pdf_file = request.FILES.get("file")
        if not pdf_file:
            return Response({"error": "Fișierul lipsește."}, status=400)

        try:
            text_extras = ""

            with pdfplumber.open(pdf_file) as pdf:
                for page in pdf.pages:
                    text_extras += page.extract_text() or ""

            if not text_extras.strip():
                return Response(
                    {"error": "PDF-ul pare să fie gol sau scanat ca imagine."},
                    status=400,
                )

            try:

                lesson = Lesson.objects.get(id=lesson_id)

                lesson.lesson_material_text = text_extras
                lesson.save()

                return Response(
                    {
                        "message": "Material încărcat cu succes!",
                        "lesson_id": lesson.id,
                    },
                    status=201,
                )

            except Lesson.DoesNotExist:
                return Response({"error": "Lecția nu a fost găsită."}, status=404)

        except Exception as e:
            return Response({"error": str(e)}, status=500)


class ParentCall(APIView):
    permission_classes = [IsAuthenticated, IsTeacher]

    def post(self, request, lesson_id, child_id):
        child = get_object_or_404(ChildProfile, id=child_id)
        parent_phone_number = child.parent.user.phone_number

        lesson = Lesson.objects.get(id=lesson_id)
        child = ChildProfile.objects.get(id=child_id)
        if lesson.present_students.filter(id=child_id).exists():
            return Response(
                {"error": "Copilul este deja la lecție!"},
                status=400,
            )

        if not parent_phone_number:
            return Response(
                {"error": "Părintele nu are un număr de telefon înregistrat."},
                status=400,
            )

        # Validare format număr înainte să facem apelul
        try:
            parsed = phonenumbers.parse(parent_phone_number, None)
            if not phonenumbers.is_valid_number(parsed):
                return Response(
                    {"error": "Numărul de telefon nu este valid."}, status=400
                )
        except phonenumbers.NumberParseException:
            return Response(
                {"error": "Formatul numărului de telefon este incorect."}, status=400
            )

        client = Client(
            os.getenv("TWILIO_ACCOUNT_SID"),
            os.getenv("TWILIO_AUTH_TOKEN"),
        )

        try:
            call = client.calls.create(
                to=parent_phone_number,
                from_=os.getenv("TWILIO_PHONE_NUMBER"),
                twiml='<Response><Say language="ro-RO">Buna ziua! Ora de programare a început! Te așteptăm!</Say></Response>',
            )

            # Mapam statusul Twilio la ceva lizibil pentru frontend
            status_map = {
                "queued": "Apelul a fost pus în coadă.",
                "initiated": "Apelul a fost inițiat.",
                "ringing": "Telefonul sună.",
                "in-progress": "Apel în curs.",
                "completed": "Apelul s-a terminat.",
                "busy": "Numărul este ocupat.",
                "no-answer": "Nu a răspuns nimeni.",
                "canceled": "Apelul a fost anulat.",
                "failed": "Apelul a eșuat.",
            }

            return Response(
                {
                    "success": True,
                    "call_sid": call.sid,
                    "status": call.status,
                    "status_message": status_map.get(call.status, call.status),
                    "to": parent_phone_number,
                },
                status=200,
            )

        except TwilioRestException as e:
            # Twilio error codes: https://www.twilio.com/docs/api/errors
            error_map = {
                21211: "Numărul de telefon nu există sau este invalid.",
                21214: "Numărul nu poate fi apelat.",
                21215: "Numărul nu este permis pentru această regiune.",
                21216: "Contul Twilio nu poate apela acest număr.",
                13224: "Numărul de telefon nu este valid.",
            }
            message = error_map.get(e.code, f"Eroare Twilio: {e.msg}")
            return Response(
                {"success": False, "error": message, "twilio_code": e.code}, status=400
            )


class ConsumeCreditView(APIView):
    def post(self, request, lesson_id):
        child_id = request.data.get("child_id")

        try:
            with transaction.atomic():
                lesson = Lesson.objects.get(id=lesson_id)
                child = ChildProfile.objects.select_for_update().get(id=child_id)

                if child in lesson.present_students.all():
                    return Response(
                        {"message": "Acces deja deblocat. Te reconectăm!"},
                        status=status.HTTP_200_OK,
                    )

                if child.credits <= 0:
                    return Response(
                        {
                            "error": "Nu ai suficiente credite pentru a intra la această oră."
                        },
                        status=status.HTTP_402_PAYMENT_REQUIRED,
                    )

                child.credits -= 1
                child.save()

                lesson.present_students.add(child)

                return Response(
                    {"message": "Credit consumat. Acces permis!"},
                    status=status.HTTP_200_OK,
                )

        except Lesson.DoesNotExist:
            return Response({"error": "Lecția nu a fost găsită."}, status=404)
        except ChildProfile.DoesNotExist:
            return Response({"error": "Copilul nu a fost găsit."}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class ScheduleMakeupLessonView(APIView):
    def post(self, request):
        child_id = request.data.get("child_id")
        date_str = request.data.get("date")  # Format așteptat: 'YYYY-MM-DD'
        time_str = request.data.get("time")  # Format așteptat: '19:00'

        try:
            child = ChildProfile.objects.get(id=child_id)
            teacher = child.classroom.teacher
            if not child.classroom:
                return Response(
                    {
                        "error": "Acest copil nu are încă o clasă atribuită. Nu poți programa o recuperare."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            datetime_str = f"{date_str} {time_str}"
            naive_datetime = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M")
            aware_datetime = make_aware(naive_datetime)

            makeup_lesson, created = Lesson.objects.get_or_create(
                classroom=child.classroom, date_time=aware_datetime, is_makeup=True
            )

            makeup_lesson.makeup_students.add(child)

            return Response(
                {"message": "Recuperarea a fost programată!"},
                status=status.HTTP_201_CREATED,
            )

        except ChildProfile.DoesNotExist:
            return Response(
                {"error": "Copilul nu a fost găsit."}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Tests views

client = genai.Client()


class CreateTestView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, lesson_id):
        pdf_file = request.FILES.get("file")
        if not pdf_file:
            return Response({"error": "Fișierul lipsește."}, status=400)

        try:
            text_extras = ""

            with pdfplumber.open(pdf_file) as pdf:
                for page in pdf.pages:
                    text_extras += page.extract_text() or ""

            if not text_extras.strip():
                return Response(
                    {"error": "PDF-ul pare să fie gol sau scanat ca imagine."},
                    status=400,
                )

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
            json_text = raw_text.replace("```json", "").replace("```", "").strip()
            test_data = json.loads(json_text)
            try:

                lesson = Lesson.objects.get(id=lesson_id)

                lesson.generated_test = test_data
                lesson.save()

                return Response(
                    {
                        "message": "Test generat și salvat cu succes!",
                        "lesson_id": lesson.id,
                        "test": lesson.generated_test,
                    },
                    status=201,
                )

            except Lesson.DoesNotExist:
                return Response({"error": "Lecția nu a fost găsită."}, status=404)

        except json.JSONDecodeError:
            return Response(
                {"error": "AI-ul a returnat un format invalid."}, status=500
            )
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class StartTestView(APIView):
    def post(self, request, lesson_id):
        try:
            lesson = Lesson.objects.get(id=lesson_id)

            if not lesson.generated_test:
                return Response(
                    {
                        "error": "Nu poți porni testul pentru că nu a fost încărcat sau generat niciun test pentru această lecție!"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if lesson.present_students.count() == 0:
                return Response(
                    {
                        "error": "Nu se poate începe testul. Niciun elev nu este prezent la oră!"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            lesson.is_test_active = True
            lesson.save()
            return Response({"message": "Testul a început!"}, status=status.HTTP_200_OK)
        except Lesson.DoesNotExist:
            return Response(
                {"error": "Lecția nu a fost găsită."}, status=status.HTTP_404_NOT_FOUND
            )


class TestStatusView(APIView):
    def get(self, request, lesson_id):
        try:
            lesson = Lesson.objects.only("is_test_active").get(id=lesson_id)
            return Response(
                {"is_test_active": lesson.is_test_active}, status=status.HTTP_200_OK
            )

        except Lesson.DoesNotExist:
            return Response(
                {"error": "Lecția nu a fost găsită."}, status=status.HTTP_404_NOT_FOUND
            )


class GetTestQuestionsView(APIView):
    def get(self, request, lesson_id):
        try:
            lesson = Lesson.objects.only("generated_test", "is_test_active").get(
                id=lesson_id
            )

            if not lesson.is_test_active:
                return Response({"error": "Testul nu a început încă."}, status=403)

            return Response(
                {"test_data": lesson.generated_test}, status=status.HTTP_200_OK
            )

        except Lesson.DoesNotExist:
            return Response(
                {"error": "Lecția nu a fost găsită."}, status=status.HTTP_404_NOT_FOUND
            )


class SubmitTestView(APIView):
    def post(self, request, lesson_id):
        try:
            lesson = Lesson.objects.get(id=lesson_id)

            child_id = request.data.get("child_id")
            child_answers = request.data.get(
                "answers", {}
            )  # Punem un default {} ca să nu crape dacă e gol

            try:
                child = ChildProfile.objects.get(id=child_id)
            except ChildProfile.DoesNotExist:
                return Response({"error": "Copilul nu a fost găsit."}, status=404)

            ai_test = lesson.generated_test
            if not ai_test:
                return Response(
                    {"error": "Acest test nu are întrebări generate."}, status=400
                )

            total_questions = len(ai_test)
            correct_answers_count = 0

            for index_str, answer in child_answers.items():
                index = int(index_str)
                if index < total_questions and answer == ai_test[index].get(
                    "correct_answer"
                ):
                    correct_answers_count += 1

            score = (
                (correct_answers_count / total_questions) * 100
                if total_questions > 0
                else 0
            )

            TestResult.objects.create(
                lesson=lesson, child=child, child_answer=child_answers, score=score
            )

            present_count = lesson.present_students.count()
            results_count = TestResult.objects.filter(lesson=lesson).count()

            if results_count >= present_count and present_count > 0:
                lesson.is_test_active = False
                lesson.save()

            return Response(
                {
                    "message": "Test salvat cu succes!",
                    "score": score,
                    "correct_answers": correct_answers_count,
                    "total_questions": total_questions,
                    "is_test_active": lesson.is_test_active,  # Îi spunem frontend-ului starea actuală
                },
                status=status.HTTP_201_CREATED,
            )

        except Lesson.DoesNotExist:
            return Response(
                {"error": "Lecția nu a fost găsită."}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TeacherScheduleView(APIView):
    permission_classes = [IsAuthenticated, IsTeacher]

    def post(self, request, *args, **kwargs):
        user = request.user

        teacher_profile = user.teacher_profile
        new_schedule = request.data.get("schedule", [])

        day_mapping = {
            "Luni": "Mon",
            "Marți": "Tue",
            "Miercuri": "Wed",
            "Joi": "Thu",
            "Vineri": "Fri",
            "Sâmbătă": "Sat",
            "Duminică": "Sun",
        }

        parsed_availabilities = []

        for row in new_schedule:
            day_ro = row.get("day")
            start_time_str = row.get("startTime")
            end_time_str = row.get("endTime")

            if not day_ro or not start_time_str or not end_time_str:
                continue

            db_day = day_mapping.get(day_ro)
            if not db_day:
                return Response(
                    {"error": f"Zi invalidă trimisă din frontend: {day_ro}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                start_time = datetime.strptime(start_time_str, "%H:%M").time()
                end_time = datetime.strptime(end_time_str, "%H:%M").time()
            except ValueError:
                return Response(
                    {"error": "Formatul orei este invalid."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if start_time >= end_time:
                return Response(
                    {
                        "error": f"Ora de început trebuie să fie înaintea orei de sfârșit pentru ziua de {day_ro}."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            parsed_availabilities.append(
                {
                    "day": db_day,
                    "day_ro": day_ro,
                    "start_time": start_time,
                    "end_time": end_time,
                }
            )

        existing_classrooms = Classroom.objects.filter(
            teacher=teacher_profile, is_canceled=False
        )

        for avail in parsed_availabilities:
            a_day = avail["day"]
            a_start = avail["start_time"]
            a_end = avail["end_time"]

            for classroom in existing_classrooms:
                if classroom.schedule_day == a_day:
                    c_start = classroom.schedule_time

                    if a_start <= c_start < a_end:
                        zi_ro = avail["day_ro"]
                        return Response(
                            {
                                "error": f"Atenție: Nu poți seta recuperări {zi_ro} între {a_start.strftime('%H:%M')} și {a_end.strftime('%H:%M')}, deoarece ai deja o grupă normală programată la ora {c_start.strftime('%H:%M')}!"
                            },
                            status=status.HTTP_409_CONFLICT,
                        )

        TeacherAvailability.objects.filter(teacher=teacher_profile).delete()

        availabilities_to_create = [
            TeacherAvailability(
                teacher=teacher_profile,
                day=item["day"],
                start_time=item["start_time"],
                end_time=item["end_time"],
            )
            for item in parsed_availabilities
        ]

        TeacherAvailability.objects.bulk_create(availabilities_to_create)

        return Response(
            {"message": "Programul a fost salvat cu succes!"}, status=status.HTTP_200_OK
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
                if index < len(ai_test) and answer != ai_test[index].get(
                    "correct_answer"
                ):
                    greseli.append(
                        {
                            "intrebare": ai_test[index].get("question"),
                            "raspuns_corect": ai_test[index].get("correct_answer"),
                            "raspunsul_lui": answer,
                        }
                    )

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
            model="gemini-3-flash-preview",  # Sau modelul pe care îl folosești deja
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
            return Response(
                {"error": "Lecția nu a fost găsită."}, status=status.HTTP_404_NOT_FOUND
            )

        # Măsură de siguranță: doar profesorul are voie să apese acest buton
        if str(request.user.role).lower() != "teacher":
            return Response(
                {"error": "Doar profesorul poate încheia lecția."},
                status=status.HTTP_403_FORBIDDEN,
            )

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
                    args=(lesson, child, parent_email, ai_test),
                )
                thread.start()  # Îi dăm ordinul de start

        # 4. raspuns instantaneu fronendului
        return Response(
            {
                "message": "Lecția s-a încheiat cu succes. Rapoartele AI se generează în fundal!"
            },
            status=status.HTTP_200_OK,
        )


class GlitchChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        lesson_id = request.data.get("lesson_id")
        user_message = request.data.get("message")
        frontend_history = request.data.get("history", [])

        if not lesson_id or not user_message:
            return Response(
                {"error": "Lipsesc datele necesare."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            lesson = Lesson.objects.get(id=lesson_id)
            lesson_content = lesson.lesson_material_text

            system_instruction = f"""
            Ești Glitch, un robot educațional prietenos, asistent în cadrul platformei BitWise Academy.
            Vorbești mereu la persoana I, ești politicos și încurajator.
            
            REGULA TA DE AUR: Ai voie să răspunzi STRICT pe baza informațiilor din textul lecției de mai jos, și informații externe doar despre subiect, doar la nevoie 
            Dacă elevul pune o întrebare care nu se regăsește în textul lecției, 
            TREBUIE să răspunzi cu: "Scuze, dar sunt setat să te ajut doar cu informații din lecția curentă!"
            
            TEXTUL LECȚIEI:
            {lesson_content}
            """

            # Formatăm istoricul primit de la React pentru NOUL format Gemini
            gemini_history = []
            for msg in frontend_history:
                role = "model" if msg["role"] == "bot" else "user"
                # Noul SDK folosește tipuri stricte de date (types.Content și types.Part)
                gemini_history = []
            for msg in frontend_history:
                role = "model" if msg["role"] == "bot" else "user"
                gemini_history.append({"role": role, "parts": [{"text": msg["text"]}]})

            # Creăm sesiunea de chat și îi dăm 'config' tot ca pe un dicționar
            chat = client.chats.create(
                model="gemini-2.5-flash",
                config={"system_instruction": system_instruction, "temperature": 0.3},
                history=gemini_history,
            )

            # Trimitem mesajul nou
            response = chat.send_message(user_message)

            return Response({"reply": response.text}, status=status.HTTP_200_OK)

        except Lesson.DoesNotExist:
            return Response(
                {"error": "Lecția nu a fost găsită."}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Eroare Gemini API: {str(e)}")
            return Response(
                {"error": "Glitch are probleme tehnice momentan."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def close_channel(request, lesson_id):
    try:
        lesson = Lesson.objects.get(id=lesson_id)
    except Lesson.DoesNotExist:
        return Response(
            {"error": "Lecția nu există."}, status=status.HTTP_404_NOT_FOUND
        )

    user = request.user
    if str(user.role).lower() != "teacher":
        return Response({"status": "ok"}, status=status.HTTP_200_OK)

    lesson.channel_name = f"lesson_{lesson.id}_{lesson.classroom.id}"
    lesson.save()

    return Response({"status": "Canalul a fost închis."}, status=status.HTTP_200_OK)
