import React, { useState, useEffect } from "react";
import "../styles/schedule_form.scss";
import { useNavigate } from "react-router-dom";
import api from "../api";

interface ScheduleRow {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
}

interface ScheduleFormProps {
  initialData?: any;
}

export default function ScheduleForm({ initialData }: ScheduleFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const reverseDayMapping: Record<string, string> = {
    Mon: "Luni",
    Tue: "Marți",
    Wed: "Miercuri",
    Thu: "Joi",
    Fri: "Vineri",
    Sat: "Sâmbătă",
    Sun: "Duminică",
  };

  const [schedule, setSchedule] = useState<ScheduleRow[]>([
    { id: "1", day: "Luni", startTime: "", endTime: "" },
    { id: "2", day: "Marți", startTime: "", endTime: "" },
    { id: "3", day: "Miercuri", startTime: "", endTime: "" },
    { id: "4", day: "Joi", startTime: "", endTime: "" },
    { id: "5", day: "Vineri", startTime: "", endTime: "" },
    { id: "6", day: "Sâmbătă", startTime: "", endTime: "" },
    { id: "7", day: "Duminică", startTime: "", endTime: "" },
  ]);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      // Șablon de bază curat
      let newSchedule = [
        { id: "1", day: "Luni", startTime: "", endTime: "" },
        { id: "2", day: "Marți", startTime: "", endTime: "" },
        { id: "3", day: "Miercuri", startTime: "", endTime: "" },
        { id: "4", day: "Joi", startTime: "", endTime: "" },
        { id: "5", day: "Vineri", startTime: "", endTime: "" },
        { id: "6", day: "Sâmbătă", startTime: "", endTime: "" },
        { id: "7", day: "Duminică", startTime: "", endTime: "" },
      ];

      initialData.forEach((avail: any) => {
        const romanianDay = reverseDayMapping[avail.day] || avail.day;
        const formattedStart = avail.start_time.substring(0, 5);
        const formattedEnd = avail.end_time.substring(0, 5);

        const rowIndex = newSchedule.findIndex(
          (row) => row.day === romanianDay,
        );

        if (rowIndex !== -1) {
          if (newSchedule[rowIndex].startTime === "") {
            newSchedule[rowIndex].startTime = formattedStart;
            newSchedule[rowIndex].endTime = formattedEnd;
          } else {
            newSchedule.splice(rowIndex + 1, 0, {
              id: crypto.randomUUID(),
              day: romanianDay,
              startTime: formattedStart,
              endTime: formattedEnd,
            });
          }
        }
      });

      setSchedule(newSchedule);
    }
  }, [initialData]);

  const handleTimeChange = (
    id: string,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setSchedule((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const handleRemove = (id: string) => {
    setSchedule((prev) => prev.filter((row) => row.id !== id));
  };

  const handleAdd = (id: string) => {
    setSchedule((prev) => {
      const rowIndex = prev.findIndex((row) => row.id === id);
      if (rowIndex === -1) return prev;

      const targetDay = prev[rowIndex].day;

      const newRow: ScheduleRow = {
        id: crypto.randomUUID(),
        day: targetDay,
        startTime: "",
        endTime: "",
      };

      const newSchedule = [...prev];
      newSchedule.splice(rowIndex + 1, 0, newRow);
      return newSchedule;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const filledRows = schedule.filter(
      (row) => row.startTime !== "" && row.endTime !== "",
    );

    for (const row of filledRows) {
      if (row.startTime >= row.endTime) {
        setErrorMessage(
          `Eroare la ziua de ${row.day}: Ora de început trebuie să fie înaintea orei de sfârșit!`,
        );
        setIsSaving(false);
        return;
      }
    }

    try {
      const response = await api.post("/api/teacher/schedule/", {
        schedule: filledRows,
      });

      setSuccessMessage(
        response.data.message || "Programul a fost salvat cu succes!",
      );
    } catch (err: any) {
      console.error("Eroare la salvarea programului:", err);

      if (err.response && err.response.data && err.response.data.error) {
        setErrorMessage(err.response.data.error);
      } else {
        setErrorMessage("A apărut o eroare de conexiune. Încearcă din nou.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard");
  };

  return (
    <div className="schedule-container">
      {errorMessage && (
        <div
          style={{
            color: "#d93025",
            backgroundColor: "#fce8e6",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "15px",
            fontWeight: 500,
          }}
        >
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div
          style={{
            color: "#1e8e3e",
            backgroundColor: "#e6f4ea",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "15px",
            fontWeight: 500,
          }}
        >
          {successMessage}
        </div>
      )}
      <form onSubmit={handleSave} className="schedule-form">
        <div className="schedule-list">
          {schedule.map((row) => (
            <div key={row.id} className="schedule-row">
              <div className="day-square">{row.day}</div>

              <div className="time-group">
                <input
                  type="time"
                  className="time-input"
                  value={row.startTime}
                  onChange={(e) =>
                    handleTimeChange(row.id, "startTime", e.target.value)
                  }
                />

                <span className="time-separator">—</span>

                <input
                  type="time"
                  className="time-input"
                  value={row.endTime}
                  onChange={(e) =>
                    handleTimeChange(row.id, "endTime", e.target.value)
                  }
                />
              </div>

              <div className="action-icons">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => handleRemove(row.id)}
                  aria-label="Remove"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15.9283 5.30936L5.30957 15.9281M5.30957 5.30936L15.9283 15.9281"
                      stroke="black"
                      strokeWidth="1.76979"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => handleAdd(row.id)}
                  aria-label="Add"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="11"
                      stroke="black"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M12 7V17M7 12H17"
                      stroke="black"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="schedule-actions">
          <button
            type="submit"
            className={`btn--primary ${isSaving ? "loading" : ""}`}
            disabled={isSaving}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ marginRight: "8px" }}
            >
              <path
                d="M19 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H16L20 7V20C20 20.5523 19.5523 21 19 21Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17 21V13H7V21M7 3V8H15V3"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {isSaving ? "Se salvează..." : "Salvează"}
          </button>

          <button type="button" className="btn--outline" onClick={handleCancel}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ marginRight: "8px" }}
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M15 9L9 15M9 9L15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Anulare
          </button>
        </div>
      </form>
    </div>
  );
}
