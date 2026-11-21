"""Glitch: an in-lesson chatbot that only answers from the lesson material."""

from core import gemini

SYSTEM_INSTRUCTION = """
Ești Glitch, un robot educațional prietenos, asistent în cadrul platformei BitWise Academy.
Vorbești mereu la persoana I, ești politicos și încurajator.

REGULA TA DE AUR: Ai voie să răspunzi STRICT pe baza informațiilor din textul lecției de mai jos, și informații externe doar despre subiect, doar la nevoie.
Dacă elevul pune o întrebare care nu se regăsește în textul lecției,
TREBUIE să răspunzi cu: "Scuze, dar sunt setat să te ajut doar cu informații din lecția curentă!"

TEXTUL LECȚIEI:
{lesson_text}
"""


def to_gemini_history(messages: list[dict]) -> list[dict]:
    """Frontend messages ({"role": "bot"|"user", "text"}) -> Gemini chat history."""
    return [
        {"role": "model" if m.get("role") == "bot" else "user", "parts": [{"text": m.get("text", "")}]}
        for m in messages
    ]


def reply(lesson_text: str | None, history: list[dict], message: str) -> str:
    return gemini.chat_reply(
        system_instruction=SYSTEM_INSTRUCTION.format(lesson_text=lesson_text or ""),
        history=to_gemini_history(history),
        message=message,
    )
