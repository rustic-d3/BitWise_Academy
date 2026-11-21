"""End-of-lesson report: an AI-written email to every present child's parent."""

import logging
import threading

from django.conf import settings
from django.core.mail import send_mail
from django.db import close_old_connections

from accounts.models import ChildProfile
from classrooms.models import Lesson
from core import gemini

from .models import TestResult
from .quiz import grade

logger = logging.getLogger(__name__)

REPORT_PROMPT_HEADER = """
Ești un asistent educațional profesionist și prietenos.
Scrie un email scurt (maxim 3 paragrafe) către un părinte.
Nume copil: {child}.
Profesor copil: {teacher}
Data și titlul lecției: {title} - {date}.
"""

WITH_TEST = """
Scor la testul de final: {score}%.
Greșeli făcute de copil (dacă există): {mistakes}.

Te rog să fii încurajator. Menționează pe scurt despre ce a fost lecția (informații aici: {material}).
Dacă a făcut greșeli, sugerează-i părintelui un sfat practic și simplu.
Dacă a luat 100%, felicită-l!
Semnează cu 'Echipa Educațională Bitwise Academy'.
"""

WITHOUT_TEST = """
Te rog să fii încurajator. Menționează pe scurt despre ce a fost lecția, extrăgând ideile principale din acest text suport:
{material}

Felicită copilul pentru participarea activă la oră!
Semnează cu 'Echipa Educațională Bitwise Academy'.
"""


def build_report_prompt(lesson: Lesson, child: ChildProfile, result: TestResult | None) -> str:
    teacher = lesson.classroom.teacher.user
    material = lesson.lesson_material_text or "Nu există suport de curs!"
    prompt = REPORT_PROMPT_HEADER.format(
        child=child.full_name,
        teacher=f"{teacher.last_name} {teacher.first_name}",
        title=lesson.classroom.titlu,
        date=lesson.date_time,
    )

    if result and lesson.generated_test:
        mistakes = grade(lesson.generated_test, result.child_answer).mistakes
        return prompt + WITH_TEST.format(
            score=result.score,
            mistakes=[vars(m) for m in mistakes],
            material=material[:2000],
        )
    return prompt + WITHOUT_TEST.format(material=material[:3000])


def send_lesson_report(lesson_id: int, child_id: int) -> None:
    try:
        lesson = Lesson.objects.select_related("classroom__teacher__user").get(id=lesson_id)
        child = ChildProfile.objects.select_related("parent__user").get(id=child_id)
        result = TestResult.objects.filter(lesson=lesson, child=child).first()

        send_mail(
            subject=f"Raport Lecție: {lesson.classroom.titlu} - {child.full_name}",
            message=gemini.generate_text(build_report_prompt(lesson, child, result)),
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[child.parent.user.email],
            fail_silently=False,
        )
        logger.info("Lesson %s report sent for child %s", lesson_id, child_id)
    except Exception:
        logger.exception("Lesson %s report failed for child %s", lesson_id, child_id)


def _send_in_background(lesson_id: int, child_id: int) -> None:
    try:
        send_lesson_report(lesson_id, child_id)
    finally:
        close_old_connections()  # each thread opens its own DB connection


def dispatch_lesson_reports(lesson: Lesson) -> int:
    """Start one background thread per present child whose parent has an email.

    Threads keep the HTTP response instant. A task queue (Celery/RQ) would be the
    next step for retries and for surviving a server restart.
    """
    children = lesson.present_students.select_related("parent__user").exclude(
        parent__user__email=""
    )
    count = 0
    for child in children:
        threading.Thread(
            target=_send_in_background, args=(lesson.id, child.id), daemon=True
        ).start()
        count += 1
    return count
