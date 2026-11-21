from unittest import mock

from rest_framework.test import APITestCase

from core.testing import make_child, make_classroom, make_lesson, make_parent, make_teacher

from .glitch import to_gemini_history


class GlitchTests(APITestCase):
    def setUp(self):
        classroom = make_classroom(make_teacher())
        self.parent = make_parent()
        make_child(self.parent, classroom)
        self.lesson = make_lesson(classroom, lesson_material_text="Buclele for")

    def test_history_is_converted_to_gemini_roles(self):
        history = to_gemini_history([{"role": "bot", "text": "Salut"}, {"role": "user", "text": "?"}])

        self.assertEqual([m["role"] for m in history], ["model", "user"])

    @mock.patch("assistant.glitch.gemini.chat_reply", return_value="O buclă repetă cod.")
    def test_reply_is_grounded_in_the_lesson_text(self, chat_reply):
        self.client.force_authenticate(self.parent.user)

        response = self.client.post(
            "/api/glitch/chat/",
            {"lesson_id": self.lesson.id, "message": "Ce e o buclă?", "history": []},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["reply"], "O buclă repetă cod.")
        self.assertIn("Buclele for", chat_reply.call_args.kwargs["system_instruction"])

    def test_outsiders_cannot_chat_about_a_lesson(self):
        self.client.force_authenticate(make_parent("other").user)

        response = self.client.post(
            "/api/glitch/chat/", {"lesson_id": self.lesson.id, "message": "?"}, format="json"
        )

        self.assertEqual(response.status_code, 404)
