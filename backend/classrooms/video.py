"""Credentials for a live lesson: Agora RTC/RTM tokens and a Netless whiteboard room."""

import logging
import time

from agora_token_builder import RtcTokenBuilder, RtmTokenBuilder
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
import requests

logger = logging.getLogger(__name__)

TOKEN_LIFETIME_SECONDS = 3600
WHITEBOARD_API = "https://api.netless.link/v5"
WHITEBOARD_REGION = "eu"
RTC_ROLE_PUBLISHER = 1
RTC_ROLE_SUBSCRIBER = 2


def _whiteboard_headers() -> dict:
    return {
        "token": settings.AGORA_WHITEBOARD_SDK_TOKEN,
        "Content-Type": "application/json",
        "region": WHITEBOARD_REGION,
    }


def _ensure_whiteboard_room(lesson) -> str | None:
    if lesson.whiteboard_uuid:
        return lesson.whiteboard_uuid

    response = requests.post(
        f"{WHITEBOARD_API}/rooms",
        headers=_whiteboard_headers(),
        json={"isRecord": False},
        timeout=10,
    )
    if response.status_code != 201:
        logger.warning("Whiteboard room creation failed: %s", response.text)
        return None

    lesson.whiteboard_uuid = response.json().get("uuid")
    lesson.save(update_fields=["whiteboard_uuid"])
    return lesson.whiteboard_uuid


def _whiteboard_token(room_uuid: str, is_teacher: bool):
    response = requests.post(
        f"{WHITEBOARD_API}/tokens/rooms/{room_uuid}",
        headers=_whiteboard_headers(),
        json={"lifespan": 0, "role": "admin" if is_teacher else "writer"},
        timeout=10,
    )
    if response.status_code != 201:
        logger.warning("Whiteboard token request failed: %s", response.text)
        return None
    return response.json()


def build_session_credentials(lesson, user) -> dict:
    app_id = settings.AGORA_APP_ID
    certificate = settings.AGORA_APP_CERTIFICATE
    if not app_id or not certificate:
        raise ImproperlyConfigured(
            "AGORA_APP_ID sau AGORA_APP_CERTIFICATE lipsesc! Verifică fișierul .env."
        )

    if not lesson.channel_name:
        lesson.channel_name = lesson.default_channel_name
        lesson.save(update_fields=["channel_name"])

    is_teacher = user.is_teacher
    expires_at = int(time.time()) + TOKEN_LIFETIME_SECONDS
    rtc_role = RTC_ROLE_PUBLISHER if is_teacher else RTC_ROLE_SUBSCRIBER

    video_token = RtcTokenBuilder.buildTokenWithUid(
        app_id, certificate, lesson.channel_name, 0, rtc_role, expires_at
    )
    rtm_token = RtmTokenBuilder.buildToken(app_id, certificate, str(user.id), 1, expires_at)

    room_uuid = _ensure_whiteboard_room(lesson)
    board_token = _whiteboard_token(room_uuid, is_teacher) if room_uuid else None

    teacher_user = lesson.classroom.teacher.user
    participants = {
        str(student.parent.user_id): student.full_name
        for student in lesson.classroom.students.select_related("parent")
    }

    return {
        "token": video_token,
        "rtm_token": rtm_token,
        "uid": user.id,
        "appId": app_id,
        "channel": lesson.channel_name,
        "teacherUid": teacher_user.id,
        "teacherName": f"{teacher_user.first_name} {teacher_user.last_name}",
        "participants": participants,
        "whiteboard": {
            "uuid": room_uuid,
            "token": board_token,
            "appIdentifier": settings.AGORA_WHITEBOARD_APP_IDENTIFIER,
            "region": WHITEBOARD_REGION,
        },
    }
