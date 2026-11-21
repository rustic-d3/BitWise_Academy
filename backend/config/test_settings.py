"""Settings for the test suite: in-memory SQLite, no real email.

    python manage.py test --settings=config.test_settings
"""

from .settings import *  # noqa: F401,F403

DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
LOGGING = {"version": 1, "disable_existing_loggers": False}
