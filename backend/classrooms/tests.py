from datetime import timedelta
from unittest import mock

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from core.testing import make_child, make_classroom, make_lesson, make_parent, make_teacher

from .models import Lesson
from .scheduling import next_occurrence, sync_lessons_for_classroom


class SchedulingTests(TestCase):
    def setUp(self):
        self.classroom = make_classroom(make_teacher(), day="Wed")
        self.parent = make_parent()

    def test_next_occurrence_lands_on_the_classroom_day_and_time(self):
        when = next_occurrence(self.classroom)

        self.assertEqual(when.weekday(), 2)  # Wednesday
        self.assertEqual((when.hour, when.minute), (18, 0))
        self.assertGreater(when, timezone.now())

    def test_calendar_follows_the_least_credited_child(self):
        make_child(self.parent, self.classroom, credits=5, name="A")
        make_child(self.parent, self.classroom, credits=3, name="B")

        self.assertEqual(self.classroom.lessons.active().count(), 3)

    def test_lessons_are_weekly_and_get_a_channel(self):
        make_child(self.parent, self.classroom, credits=3)

        dates = list(self.classroom.lessons.values_list("date_time", flat=True))
        self.assertEqual(dates[1] - dates[0], timedelta(weeks=1))
        self.assertFalse(self.classroom.lessons.filter(channel_name=None).exists())

    def test_excess_lessons_are_canceled_from_the_end(self):
        child = make_child(self.parent, self.classroom, credits=4)
        child.credits = 2
        child.save()

        active = self.classroom.lessons.active().order_by("date_time")
        self.assertEqual(active.count(), 2)
        self.assertEqual(
            list(active), list(self.classroom.lessons.order_by("date_time")[:2])
        )

    def test_past_and_makeup_lessons_do_not_count_against_credits(self):
        make_lesson(self.classroom, days_from_now=-7)
        make_lesson(self.classroom, days_from_now=3, is_makeup=True)
        make_child(self.parent, self.classroom, credits=2)

        upcoming_regular = self.classroom.lessons.active().filter(
            is_makeup=False, date_time__gt=timezone.now()
        )
        self.assertEqual(upcoming_regular.count(), 2)

    def test_empty_classroom_cancels_everything(self):
        make_lesson(self.classroom)
        sync_lessons_for_classroom(self.classroom)

        self.assertFalse(self.classroom.lessons.active().exists())


class ConsumeCreditTests(APITestCase):
    def setUp(self):
        self.classroom = make_classroom(make_teacher())
        self.parent = make_parent()
        self.child = make_child(self.parent, self.classroom, credits=2)
        self.lesson = self.classroom.lessons.order_by("date_time").first()
        self.url = f"/api/lessons/{self.lesson.id}/consume-credit/"
        self.client.force_authenticate(self.parent.user)

    def test_joining_spends_one_credit_and_marks_presence(self):
        response = self.client.post(self.url, {"child_id": self.child.id})

        self.assertEqual(response.status_code, 200)
        self.child.refresh_from_db()
        self.assertEqual(self.child.credits, 1)
        self.assertTrue(self.lesson.present_students.filter(pk=self.child.pk).exists())

    def test_rejoining_is_free(self):
        self.client.post(self.url, {"child_id": self.child.id})
        self.client.post(self.url, {"child_id": self.child.id})

        self.child.refresh_from_db()
        self.assertEqual(self.child.credits, 1)

    def test_attending_does_not_shrink_the_calendar(self):
        self.client.post(self.url, {"child_id": self.child.id})

        self.assertEqual(self.classroom.lessons.active().count(), 2)

    def test_no_credits_means_payment_required(self):
        self.child.credits = 0
        self.child.save()
        lesson = make_lesson(self.classroom)

        response = self.client.post(
            f"/api/lessons/{lesson.id}/consume-credit/", {"child_id": self.child.id}
        )

        self.assertEqual(response.status_code, 402)

    def test_cannot_spend_another_parents_credits(self):
        stranger = make_parent("other")
        self.client.force_authenticate(stranger.user)

        response = self.client.post(self.url, {"child_id": self.child.id})

        self.assertEqual(response.status_code, 404)
        self.child.refresh_from_db()
        self.assertEqual(self.child.credits, 2)


class LessonAccessTests(APITestCase):
    def setUp(self):
        self.teacher = make_teacher()
        self.classroom = make_classroom(self.teacher)
        self.lesson = make_lesson(self.classroom)

    def test_teacher_cancels_and_a_replacement_is_added_at_the_end(self):
        later = make_lesson(self.classroom, days_from_now=14)
        self.client.force_authenticate(self.teacher.user)

        response = self.client.delete(f"/api/lessons/{self.lesson.id}/cancel-lesson")

        self.assertEqual(response.status_code, 200)
        self.lesson.refresh_from_db()
        self.assertTrue(self.lesson.is_canceled)
        replacement = self.classroom.lessons.order_by("-date_time").first()
        self.assertEqual(replacement.date_time, later.date_time + timedelta(days=7))

    def test_teacher_cannot_cancel_another_teachers_lesson(self):
        self.client.force_authenticate(make_teacher("other").user)

        response = self.client.delete(f"/api/lessons/{self.lesson.id}/cancel-lesson")

        self.assertEqual(response.status_code, 404)

    def test_parent_cannot_cancel_lessons(self):
        self.client.force_authenticate(make_parent().user)

        response = self.client.delete(f"/api/lessons/{self.lesson.id}/cancel-lesson")

        self.assertEqual(response.status_code, 403)

    def test_parent_without_a_child_in_the_class_cannot_join(self):
        self.client.force_authenticate(make_parent().user)

        response = self.client.get(f"/api/lessons/{self.lesson.id}/join/")

        self.assertEqual(response.status_code, 404)

    @override_settings(AGORA_APP_ID="app", AGORA_APP_CERTIFICATE="0" * 32)
    @mock.patch("classrooms.video.requests.post")
    def test_join_returns_video_and_whiteboard_credentials(self, post):
        post.side_effect = [
            mock.Mock(status_code=201, json=lambda: {"uuid": "room-1"}),
            mock.Mock(status_code=201, json=lambda: "board-token"),
        ]
        self.client.force_authenticate(self.teacher.user)

        response = self.client.get(f"/api/lessons/{self.lesson.id}/join/")

        self.assertEqual(response.status_code, 200)
        data = response.data["agora_data"]
        self.assertEqual(data["channel"], self.lesson.default_channel_name)
        self.assertEqual(data["whiteboard"]["uuid"], "room-1")
        self.assertEqual(data["whiteboard"]["token"], "board-token")


class ChildLessonsTests(APITestCase):
    def test_makeup_lessons_are_only_shown_to_their_child(self):
        classroom = make_classroom(make_teacher())
        parent = make_parent()
        ana = make_child(parent, classroom, name="Ana")
        ion = make_child(parent, classroom, name="Ion")
        regular = make_lesson(classroom)
        makeup = make_lesson(classroom, days_from_now=2, is_makeup=True)
        makeup.makeup_students.add(ana)
        self.client.force_authenticate(parent.user)

        ana_ids = [l["id"] for l in self.client.get(f"/api/child/{ana.id}/lessons/").data["results"]]
        ion_ids = [l["id"] for l in self.client.get(f"/api/child/{ion.id}/lessons/").data["results"]]

        self.assertEqual(ana_ids, [regular.id, makeup.id])
        self.assertEqual(ion_ids, [regular.id])


class MakeupLessonTests(APITestCase):
    def test_parent_books_a_makeup_lesson(self):
        classroom = make_classroom(make_teacher())
        parent = make_parent()
        child = make_child(parent, classroom)
        self.client.force_authenticate(parent.user)

        response = self.client.post(
            "/api/lessons/create-recovery",
            {"child_id": child.id, "date": "2030-01-10", "time": "19:00"},
        )

        self.assertEqual(response.status_code, 201)
        lesson = Lesson.objects.get(is_makeup=True)
        self.assertEqual(list(lesson.makeup_students.all()), [child])

    def test_child_without_classroom_gets_a_clear_error(self):
        parent = make_parent()
        child = make_child(parent)
        self.client.force_authenticate(parent.user)

        response = self.client.post(
            "/api/lessons/create-recovery",
            {"child_id": child.id, "date": "2030-01-10", "time": "19:00"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("clasă", response.data["error"])


class CallParentTests(APITestCase):
    def setUp(self):
        self.teacher = make_teacher()
        self.lesson = make_lesson(make_classroom(self.teacher))
        self.client.force_authenticate(self.teacher.user)

    def call(self, child):
        return self.client.post(f"/api/lessons/{self.lesson.id}/call/{child.id}/")

    @mock.patch("classrooms.phone_calls.Client")
    def test_invalid_number_is_rejected_before_calling_twilio(self, twilio):
        child = make_child(make_parent(phone_number="12345"))

        response = self.call(child)

        self.assertEqual(response.status_code, 400)
        twilio.assert_not_called()

    @mock.patch("classrooms.phone_calls.Client")
    def test_valid_number_places_a_call(self, twilio):
        twilio.return_value.calls.create.return_value = mock.Mock(sid="CA1", status="queued")
        child = make_child(make_parent(phone_number="+40712345678"))

        response = self.call(child)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["call_sid"], "CA1")
        self.assertEqual(response.data["status_message"], "Apelul a fost pus în coadă.")
