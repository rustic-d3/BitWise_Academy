# BitWise Academy — Backend

Django 6 + Django REST Framework API for an online programming school for children.
Teachers run live lessons (Agora video and whiteboard), parents buy credits and book
make-up lessons, and Gemini generates quizzes, parent reports and an in-lesson tutor.

## Project layout

Each Django app owns one part of the business. Views stay thin: they check
permissions, call a service module, and shape the response. External APIs are kept
in their own modules, so tests can mock them.

```
backend/
├── config/            Settings (configured from env vars), root URLs, WSGI/ASGI
├── core/              Shared code that doesn't belong to one app
│   ├── choices.py       Subjects, weekdays
│   ├── permissions.py   IsTeacher / IsParent / IsAdmin
│   ├── exceptions.py    Consistent {"error": ...} error responses
│   ├── gemini.py        The only module that talks to Google Gemini
│   ├── pdf.py           PDF → text
│   └── testing.py       Test factories
├── accounts/          Users, teacher/parent/child profiles, auth, teacher availability
│   ├── services.py      Password reset, profile updates, availability rules
│   └── storage.py       Profile pictures on Supabase Storage
├── classrooms/        Classrooms and lessons: calendar, attendance, live session
│   ├── scheduling.py    "Upcoming lessons = credits left" rule, make-up booking
│   ├── attendance.py    Spend a credit to join a lesson (row-locked)
│   ├── video.py         Agora RTC/RTM tokens + Netless whiteboard room
│   ├── phone_calls.py   Twilio reminder call to a parent
│   └── signals.py       Re-sync the calendar when a child or credits change
├── assessments/       AI quizzes, grading, end-of-lesson reports
│   ├── quiz.py          Generate (Gemini), validate and grade quizzes
│   └── reports.py       AI-written report email to each parent (background threads)
└── assistant/         "Glitch", a chatbot that only answers from the lesson material
```

Imports go downward: `assessments`/`assistant` → `classrooms` → `accounts` → `core`.
There is one deliberate exception: a child belongs to a classroom (`ChildProfile.classroom`).
It's a string FK, and `ChildProfileSerializer` imports the classroom serializer lazily.

## Domain rules worth knowing

- **Credits drive the calendar.** A classroom always has as many upcoming regular
  lessons as its least-credited child has credits. Buying credits adds weekly
  lessons; removing credits cancels them, starting from the last one.
  Make-up lessons and past lessons don't count.
- **Joining a lesson costs one credit.** Rejoining is free. The decrement runs with
  `select_for_update` and a queryset `update()`, so it can't double-spend and doesn't
  trigger a calendar resync.
- **Access is scoped by role and ownership.** Teachers only see their own lessons.
  Parents only see their own children and their children's lessons. Students never
  receive the quiz answer key.

## Running

With Docker (from the repository root): `docker compose up --build`, then, once:

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

Locally:

```bash
pip install -r requirements.txt
cp .env-backend.template .env   # fill in the values
python manage.py migrate
python manage.py runserver
```

## Tests

The suite uses in-memory SQLite and mocks every external service (Gemini, Twilio,
Agora, Supabase), so it needs no `.env` and no network:

```bash
python manage.py test --settings=config.test_settings
```

## API overview

All routes are under `/api/` and need a JWT (`Authorization: Bearer <access>`) unless noted.

| Area | Endpoints |
| --- | --- |
| Auth (public) | `token/`, `token/refresh/`, `user/register/`, `password-reset/`, `password-reset-confirm/<uid>/<token>/` |
| Profiles | `user/profile-picture`, `teacher/profile`, `teacher/profile-settings`, `teacher/schedule/`, `parent/profile`, `parent/profile-settings` |
| Children (parent) | `children/add/`, `child/<id>/`, `child/<id>/update/`, `child/<id>/lessons/` |
| Lessons | `teacher/get_lessons/`, `lessons/<id>/join/`, `consume-credit/`, `mark-attendance/`, `skip/`, `cancel-lesson`, `call/<child_id>/`, `close-channel/`, `upload-material/`, `lessons/create-recovery` |
| Quizzes & reports | `lessons/<id>/upload-test/`, `start-test/`, `test-status/`, `test-questions/`, `submit-test/`, `end-and-report/` |
| Assistant | `glitch/chat/` |
| Admin only | `classroom/create` |
