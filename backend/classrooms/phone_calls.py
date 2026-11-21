"""Automated reminder call to a parent whose child hasn't joined the lesson (Twilio)."""

from django.conf import settings
import phonenumbers
from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client

REMINDER_TWIML = (
    '<Response><Say language="ro-RO">'
    "Buna ziua! Ora de programare a început! Te așteptăm!"
    "</Say></Response>"
)

CALL_STATUS_MESSAGES = {
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

# https://www.twilio.com/docs/api/errors
TWILIO_ERROR_MESSAGES = {
    21211: "Numărul de telefon nu există sau este invalid.",
    21214: "Numărul nu poate fi apelat.",
    21215: "Numărul nu este permis pentru această regiune.",
    21216: "Contul Twilio nu poate apela acest număr.",
    13224: "Numărul de telefon nu este valid.",
}


class CallError(Exception):
    def __init__(self, message: str, twilio_code: int | None = None):
        super().__init__(message)
        self.message = message
        self.twilio_code = twilio_code


def validate_phone_number(number: str | None) -> None:
    if not number:
        raise CallError("Părintele nu are un număr de telefon înregistrat.")
    try:
        parsed = phonenumbers.parse(number, None)
    except phonenumbers.NumberParseException:
        raise CallError("Formatul numărului de telefon este incorect.")
    if not phonenumbers.is_valid_number(parsed):
        raise CallError("Numărul de telefon nu este valid.")


def place_reminder_call(number: str) -> dict:
    validate_phone_number(number)
    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    try:
        call = client.calls.create(
            to=number, from_=settings.TWILIO_PHONE_NUMBER, twiml=REMINDER_TWIML
        )
    except TwilioRestException as exc:
        message = TWILIO_ERROR_MESSAGES.get(exc.code, f"Eroare Twilio: {exc.msg}")
        raise CallError(message, twilio_code=exc.code)

    return {
        "call_sid": call.sid,
        "status": call.status,
        "status_message": CALL_STATUS_MESSAGES.get(call.status, call.status),
        "to": number,
    }
