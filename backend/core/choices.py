"""Enumerations shared by more than one app."""

from django.db import models
from django.utils.translation import gettext_lazy as _


class ClassroomSubject(models.TextChoices):
    M1 = "M1 | Alfabetizare Digitală", _("M1")
    M2 = "M2 | Introducere În Programare", _("M2")
    M3 = "M3 | Programare Distractivă", _("M3")
    M4 = "M4 | Unity - C#", _("M4")
    M5 = "M5 | Arduino - Sisteme Încorporate", _("M5")
    M6 = "M6 | LUA - Roblox Studio", _("M6")
    M7 = "M7 | Game Design - Începător", _("M7")
    M8 = "M8 | Game Design - Intermediar", _("M8")
    M9 = "M9 | Game Design - Avansat", _("M9")


class ScheduleDay(models.TextChoices):
    MON = "Mon", "Monday"
    TUE = "Tue", "Tuesday"
    WED = "Wed", "Wednesday"
    THU = "Thu", "Thursday"
    FRI = "Fri", "Friday"
    SAT = "Sat", "Saturday"
    SUN = "Sun", "Sunday"


# ScheduleDay value -> datetime.weekday() index
WEEKDAY_INDEX = {day.value: index for index, day in enumerate(ScheduleDay)}

# Romanian day names sent by the frontend -> ScheduleDay value
ROMANIAN_DAY_NAMES = {
    "Luni": ScheduleDay.MON,
    "Marți": ScheduleDay.TUE,
    "Miercuri": ScheduleDay.WED,
    "Joi": ScheduleDay.THU,
    "Vineri": ScheduleDay.FRI,
    "Sâmbătă": ScheduleDay.SAT,
    "Duminică": ScheduleDay.SUN,
}
