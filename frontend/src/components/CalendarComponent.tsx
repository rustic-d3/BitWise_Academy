import { useState, useEffect } from "react";
import "../styles/calendar.scss";

interface Availability {
  day: string; // "Mon", "Tue", "Wed", etc.
  start_time: string; // "09:00:00"
  end_time: string; // "14:00:00"
}

interface TeacherData {
  id: number;
  name: string;
  availabilities?: Availability[];
  booked_slots?: string[];
}

interface Props {
  data: TeacherData | null;
  onSave?: (date: Date, time: string) => void;
  onCancel?: () => void;
}

export default function CalendarComponent({ data, onSave, onCancel }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");

  const weekDays = ["D", "L", "M", "M", "J", "V", "S"];
  const djangoDayMapping = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    setSelectedDate(null);
    setSelectedTime("");
  }, [data]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. VALIDARE ZI
  const isDayDisabled = (date: Date) => {
    if (date < todayStart) return true;
    if (!data?.availabilities || data.availabilities.length === 0) return true;

    const dayOfWeekStr = djangoDayMapping[date.getDay()];
    return !data.availabilities.some((avail) => avail.day === dayOfWeekStr);
  };

  // 2. GENERARE DINAMICĂ A ORELOR (SLOTURI DE 1 ORĂ)
  const getAvailableTimeSlots = () => {
    if (!selectedDate || !data?.availabilities) return [];

    const dayOfWeekStr = djangoDayMapping[selectedDate.getDay()];
    // Găsește disponibilitățile strict pentru ziua selectată
    const dayAvailabilities = data.availabilities.filter(
      (avail) => avail.day === dayOfWeekStr,
    );

    let slots: string[] = [];

    // Genereaza orele din intervalele disponibile (ex: 09:00 -> 14:00)
    dayAvailabilities.forEach((avail) => {
      const [startH] = avail.start_time.split(":").map(Number);
      const [endH] = avail.end_time.split(":").map(Number);

      // Presupunem sloturi fixe de 1 oră (ex: 09:00, 10:00... până la 13:00 pt intervalul 09-14)
      for (let h = startH; h < endH; h++) {
        slots.push(`${h.toString().padStart(2, "0")}:00`);
      }
    });

    // Dacă ziua selectată e fix AZI, scoatem orele care au trecut deja
    if (
      selectedDate.getDate() === now.getDate() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getFullYear() === now.getFullYear()
    ) {
      slots = slots.filter((slot) => {
        const [slotH] = slot.split(":").map(Number);
        return slotH > now.getHours(); // Arată doar orele care încă nu au început
      });
    }
    const formattedSelectedDate = selectedDate.toLocaleDateString("sv-SE"); // "YYYY-MM-DD"

    slots = slots.filter((slot) => {
      const slotDateTimeStr = `${formattedSelectedDate} ${slot}`;

      if (data?.booked_slots?.includes(slotDateTimeStr)) {
        return false; // Ascunde ora dacă e deja ocupată în backend la ora locală
      }
      return true;
    });

    // Sortare cronologica și eliminare de duplicate
    return Array.from(new Set(slots)).sort();
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);

    const days = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        date: d,
        isDisabled: isDayDisabled(d),
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        day: i,
        isCurrentMonth: true,
        date: d,
        isDisabled: isDayDisabled(d),
      });
    }

    return days;
  };

  const handleDayClick = (date: Date, isDisabled: boolean) => {
    if (isDisabled) return;
    setSelectedDate(date);
    setSelectedTime(""); 
    if (date.getMonth() !== currentDate.getMonth()) {
      setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  const handlePrevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  const handleNextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  const formatMonthYear = (date: Date) => {
    const months = [
      "ian.",
      "feb.",
      "mar.",
      "apr.",
      "mai",
      "iun.",
      "iul.",
      "aug.",
      "sep.",
      "oct.",
      "nov.",
      "dec.",
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };
  const isSameDay = (d1: Date | null, d2: Date) =>
    d1 &&
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  // Obținem orele dinamice pentru ziua curent selectată
  const dynamicTimeSlots = getAvailableTimeSlots();

  return (
    <div className="calendar-container">
      <div className="calendar-box">
        <div className="calendar-header">
          <span className="month-year-title">
            {formatMonthYear(currentDate)}
          </span>
          <div className="nav-arrows">
            <button onClick={handlePrevMonth}>&lt;</button>
            <button onClick={handleNextMonth}>&gt;</button>
          </div>
        </div>

        <div className="calendar-grid">
          {weekDays.map((day, index) => (
            <div key={index} className="weekday-label">
              {day}
            </div>
          ))}

          {generateCalendarDays().map((item, index) => (
            <div
              key={index}
              className={`day-cell 
                ${!item.isCurrentMonth ? "faded" : ""} 
                ${item.isDisabled ? "disabled" : ""} 
                ${isSameDay(selectedDate, item.date) ? "selected" : ""}`}
              onClick={() => handleDayClick(item.date, item.isDisabled)}
            >
              <div className="day-number">{item.day}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="time-selector"
        style={{
          justifyContent:
            dynamicTimeSlots.length > 0 ? "space-between" : "center",
        }}
      >
        {!selectedDate ? (
          <span
            className="time-disabled"
            style={{ fontSize: "0.9rem", color: "#888" }}
          >
            Selectează o zi pentru a vedea orele
          </span>
        ) : dynamicTimeSlots.length > 0 ? (
          dynamicTimeSlots.map((time) => (
            <span
              key={time}
              className={`time-item ${selectedTime === time ? "selected" : ""}`}
              onClick={() => setSelectedTime(time)}
            >
              {time}
            </span>
          ))
        ) : (
          <span
            className="time-disabled"
            style={{ fontSize: "0.9rem", color: "#000" }}
          >
            Nicio oră disponibilă
          </span>
        )}
      </div>

      <div className="calendar-actions">
        <button
          className="btn-save"
          disabled={!selectedDate || !selectedTime}
          onClick={() =>
            selectedDate && onSave && onSave(selectedDate, selectedTime)
          }
        >
          Confirmă
        </button>
        <button type="button" className="btn-cancel" onClick={onCancel}>
          Anulare
        </button>
      </div>
    </div>
  );
}
