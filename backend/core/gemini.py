"""Thin wrapper around the Google Gemini SDK.

Every AI feature goes through this module, so the rest of the code never
touches the SDK directly and tests only have to mock two functions.
"""

from functools import lru_cache

from django.conf import settings
from google import genai


@lru_cache(maxsize=1)
def get_client() -> genai.Client:
    # Created lazily: building the client at import time would crash the whole
    # backend on startup when GEMINI_API_KEY is missing.
    return genai.Client()


def generate_text(prompt: str) -> str:
    interaction = get_client().interactions.create(
        model=settings.GEMINI_MODEL,
        input=prompt,
    )
    return interaction.steps[-1].content[0].text


def chat_reply(system_instruction: str, history: list[dict], message: str) -> str:
    """Send `message` to a chat that already contains `history`.

    `history` uses the Gemini format: [{"role": "user"|"model", "parts": [{"text": ...}]}]
    """
    chat = get_client().chats.create(
        model=settings.GEMINI_CHAT_MODEL,
        config={"system_instruction": system_instruction, "temperature": 0.3},
        history=history,
    )
    return chat.send_message(message).text
