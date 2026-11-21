from django.core import mail
from rest_framework.test import APITestCase

from core.testing import make_child, make_classroom, make_parent, make_teacher

from .models import ParentProfile, User

VALID_SIGNUP = {
    "username": "maria",
    "password": "Secret123",
    "email": "maria@example.com",
    "first_name": "Maria",
    "last_name": "Pop",
}


class RegistrationTests(APITestCase):
    def test_public_signup_creates_a_parent(self):
        response = self.client.post("/api/user/register/", VALID_SIGNUP)

        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="maria")
        self.assertEqual(user.role, User.Role.PARENT)
        self.assertTrue(ParentProfile.objects.filter(user=user).exists())
        self.assertNotIn("password", response.data)

    def test_public_signup_cannot_choose_teacher_role(self):
        self.client.post("/api/user/register/", {**VALID_SIGNUP, "role": "TEACHER"})

        self.assertEqual(User.objects.get(username="maria").role, User.Role.PARENT)

    def test_weak_password_is_rejected(self):
        response = self.client.post("/api/user/register/", {**VALID_SIGNUP, "password": "alllower1"})

        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)

    def test_token_contains_role(self):
        self.client.post("/api/user/register/", VALID_SIGNUP)
        response = self.client.post(
            "/api/token/", {"username": "maria", "password": "Secret123"}
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("refresh", response.data)
        refresh = self.client.post("/api/token/refresh/", {"refresh": response.data["refresh"]})
        self.assertEqual(refresh.status_code, 200)


class PasswordResetTests(APITestCase):
    def test_reset_email_is_sent_to_existing_user(self):
        make_parent("ion")
        response = self.client.post("/api/password-reset/", {"email": "ion@example.com"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("/reset-password/", mail.outbox[0].body)

    def test_unknown_email_gets_the_same_answer(self):
        response = self.client.post("/api/password-reset/", {"email": "nobody@example.com"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)


class ProfileTests(APITestCase):
    def test_profile_picture_falls_back_to_default_avatar(self):
        parent = make_parent()
        self.client.force_authenticate(parent.user)

        response = self.client.get("/api/user/profile-picture")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["profile_picture"].endswith("no_avatar.png"))

    def test_parent_cannot_open_teacher_profile(self):
        self.client.force_authenticate(make_parent().user)

        response = self.client.get("/api/teacher/profile")

        self.assertEqual(response.status_code, 403)
        self.assertIn("error", response.data)


class ChildrenTests(APITestCase):
    def setUp(self):
        self.parent = make_parent()
        self.client.force_authenticate(self.parent.user)

    def test_parent_adds_a_child(self):
        response = self.client.post("/api/children/add/", {"full_name": "Ion", "age": 9})

        self.assertEqual(response.status_code, 201)
        self.assertEqual(self.parent.children.get().full_name, "Ion")

    def test_parent_cannot_see_someone_elses_child(self):
        stranger_child = make_child(make_parent("other"))

        response = self.client.get(f"/api/child/{stranger_child.id}/")

        self.assertEqual(response.status_code, 404)

    def test_buying_credits_extends_the_classroom_calendar(self):
        classroom = make_classroom(make_teacher())
        child = make_child(self.parent, classroom, credits=0)

        response = self.client.patch(f"/api/child/{child.id}/update/", {"credits": 4})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(classroom.lessons.active().count(), 4)


class TeacherScheduleTests(APITestCase):
    def setUp(self):
        self.teacher = make_teacher()
        self.client.force_authenticate(self.teacher.user)

    def post(self, *rows):
        return self.client.post("/api/teacher/schedule/", {"schedule": list(rows)}, format="json")

    def test_schedule_replaces_availability(self):
        response = self.post({"day": "Luni", "startTime": "10:00", "endTime": "12:00"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.teacher.availabilities.get().day, "Mon")

    def test_window_overlapping_a_regular_class_is_a_conflict(self):
        make_classroom(self.teacher, day="Mon")  # 18:00

        response = self.post({"day": "Luni", "startTime": "17:00", "endTime": "19:00"})

        self.assertEqual(response.status_code, 409)
        self.assertFalse(self.teacher.availabilities.exists())

    def test_end_before_start_is_rejected(self):
        response = self.post({"day": "Marți", "startTime": "12:00", "endTime": "10:00"})

        self.assertEqual(response.status_code, 400)
