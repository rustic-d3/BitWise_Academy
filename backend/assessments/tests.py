from unittest import mock

from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APITestCase

from core.testing import make_child, make_classroom, make_lesson, make_parent, make_teacher

from .models import TestResult
from .quiz import InvalidQuizError, grade, parse_quiz
from .reports import build_report_prompt, send_lesson_report

QUIZ = [
    {"question": "2+2?", "options": ["3", "4"], "correct_answer": "4"},
    {"question": "Capitala?", "options": ["Iași", "București"], "correct_answer": "București"},
]


class GradingTests(SimpleTestCase):
    def test_score_is_a_percentage(self):
        result = grade(QUIZ, {"0": "4", "1": "Iași"})

        self.assertEqual((result.correct, result.total, result.score), (1, 2, 50))
        self.assertEqual(result.mistakes[0].correct_answer, "București")

    def test_bad_indexes_are_ignored(self):
        result = grade(QUIZ, {"-1": "București", "7": "4", "x": "4"})

        self.assertEqual(result.correct, 0)

    def test_empty_quiz_scores_zero(self):
        self.assertEqual(grade([], {}).score, 0)


class QuizParsingTests(SimpleTestCase):
    def test_markdown_fences_are_stripped(self):
        self.assertEqual(parse_quiz(f"```json\n{QUIZ!r}\n```".replace("'", '"')), QUIZ)

    def test_non_json_is_rejected(self):
        with self.assertRaises(InvalidQuizError):
            parse_quiz("Sigur! Iată testul tău:")

    def test_wrong_shape_is_rejected(self):
        with self.assertRaises(InvalidQuizError):
            parse_quiz('[{"question": "fără variante"}]')


class QuizFlowTests(APITestCase):
    def setUp(self):
        self.teacher = make_teacher()
        self.classroom = make_classroom(self.teacher)
        self.parent = make_parent()
        self.child = make_child(self.parent, self.classroom, name="Ana")
        self.lesson = make_lesson(self.classroom, generated_test=QUIZ)
        self.lesson.present_students.add(self.child)

    def url(self, action):
        return f"/api/lessons/{self.lesson.id}/{action}/"

    @mock.patch("assessments.views.extract_text", return_value="Despre adunare")
    @mock.patch("assessments.quiz.gemini.generate_text")
    def test_teacher_generates_a_quiz_from_a_pdf(self, generate_text, _extract):
        generate_text.return_value = '[{"question": "q", "options": ["a"], "correct_answer": "a"}]'
        self.client.force_authenticate(self.teacher.user)
        pdf = SimpleUploadedFile("lesson.pdf", b"%PDF", content_type="application/pdf")

        response = self.client.post(self.url("upload-test"), {"file": pdf}, format="multipart")

        self.assertEqual(response.status_code, 201)
        self.lesson.refresh_from_db()
        self.assertEqual(self.lesson.generated_test[0]["question"], "q")

    def test_students_do_not_receive_the_answer_key(self):
        self.lesson.is_test_active = True
        self.lesson.save()
        self.client.force_authenticate(self.parent.user)

        response = self.client.get(self.url("test-questions"))

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("correct_answer", response.data["test_data"][0])

    def test_questions_are_hidden_until_the_quiz_starts(self):
        self.client.force_authenticate(self.parent.user)

        self.assertEqual(self.client.get(self.url("test-questions")).status_code, 403)

    def test_submission_is_graded_and_closes_the_quiz_when_everyone_answered(self):
        self.lesson.is_test_active = True
        self.lesson.save()
        self.client.force_authenticate(self.parent.user)

        response = self.client.post(
            self.url("submit-test"),
            {"child_id": self.child.id, "answers": {"0": "4", "1": "București"}},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["score"], 100)
        self.assertFalse(response.data["is_test_active"])

    def test_resubmitting_replaces_the_previous_result(self):
        self.client.force_authenticate(self.parent.user)
        for answers in ({"0": "3"}, {"0": "4"}):
            self.client.post(
                self.url("submit-test"),
                {"child_id": self.child.id, "answers": answers},
                format="json",
            )

        self.assertEqual(TestResult.objects.get().score, 50)

    def test_quiz_cannot_start_without_students(self):
        self.lesson.present_students.clear()
        self.client.force_authenticate(self.teacher.user)

        self.assertEqual(self.client.post(self.url("start-test")).status_code, 400)

    @mock.patch("assessments.views.dispatch_lesson_reports")
    def test_ending_the_lesson_closes_the_channel_and_sends_reports(self, dispatch):
        self.client.force_authenticate(self.teacher.user)

        response = self.client.post(self.url("end-and-report"))

        self.assertEqual(response.status_code, 200)
        self.lesson.refresh_from_db()
        self.assertTrue(self.lesson.channel_name.endswith("_closed"))
        dispatch.assert_called_once()


class ReportTests(TestCase):
    def setUp(self):
        self.classroom = make_classroom(make_teacher(first_name="Ion", last_name="Popescu"))
        self.child = make_child(make_parent(), self.classroom, name="Ana")
        self.lesson = make_lesson(
            self.classroom, generated_test=QUIZ, lesson_material_text="Adunarea numerelor"
        )

    def test_prompt_includes_score_and_mistakes(self):
        result = TestResult.objects.create(
            lesson=self.lesson, child=self.child, child_answer={"1": "Iași"}, score=0
        )

        prompt = build_report_prompt(self.lesson, self.child, result)

        self.assertIn("Ana", prompt)
        self.assertIn("Popescu Ion", prompt)
        self.assertIn("Iași", prompt)

    @mock.patch("assessments.reports.gemini.generate_text", return_value="Raport AI")
    def test_report_is_emailed_to_the_parent(self, _generate):
        send_lesson_report(self.lesson.id, self.child.id)

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["parent@example.com"])
        self.assertEqual(mail.outbox[0].body, "Raport AI")
