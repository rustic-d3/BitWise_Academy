import { useState } from "react";
import "../styles/class_session.scss";
import type { LessonWithClassroom } from "../Types";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "./ConfirmModal";
import UploadTestModal from "./UploadTestModal";
import api from "../api";

interface Props {
  role: "teacher" | "parent";
  lesson: LessonWithClassroom;
  childId?: number;
  onSkip?: (lessonId: number) => void;
  onDelete?: (id: number) => void;
}

const CheckIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.22782 5.5276C1.22762 4.84132 1.39175 4.16496 1.70649 3.55511C2.02123 2.94526 2.47742 2.41964 3.03692 2.02222C3.59641 1.6248 4.24294 1.36713 4.92241 1.27076C5.60189 1.17439 6.29457 1.24213 6.94251 1.46831C7.09632 1.52188 7.26511 1.51217 7.41176 1.44129C7.5584 1.37041 7.67089 1.24419 7.72446 1.09038C7.77804 0.936567 7.76832 0.767773 7.69745 0.621128C7.62657 0.474483 7.50034 0.361999 7.34653 0.308422C6.21511 -0.0863053 4.98603 -0.102571 3.84455 0.262077C2.70307 0.626726 1.71105 1.35253 1.01801 2.33009C0.324959 3.30765 -0.0315568 4.484 0.0021934 5.68183C0.0359436 6.87966 0.45813 8.03406 1.20512 8.97105C1.95211 9.90804 2.98343 10.5768 4.14363 10.8766C5.30383 11.1764 6.53004 11.091 7.63744 10.6332C8.74485 10.1754 9.67344 9.36999 10.2833 8.33846C10.8931 7.30693 11.1511 6.10512 11.0184 4.91419C11.0095 4.83404 10.9849 4.75642 10.9461 4.68576C10.9072 4.61511 10.8548 4.5528 10.7919 4.5024C10.7289 4.45199 10.6566 4.41448 10.5792 4.39201C10.5018 4.36953 10.4206 4.36252 10.3405 4.37139C10.2603 4.38026 10.1827 4.40483 10.1121 4.4437C10.0414 4.48257 9.97911 4.53497 9.92871 4.59792C9.8783 4.66086 9.84079 4.73312 9.81831 4.81057C9.79584 4.88801 9.78883 4.96912 9.7977 5.04927C9.86238 5.63007 9.80793 6.21796 9.6377 6.777C9.46747 7.33605 9.18502 7.8545 8.80762 8.30069C8.43022 8.74687 7.9658 9.11141 7.44274 9.37202C6.91968 9.63263 6.34897 9.78384 5.76549 9.81641C5.18201 9.84897 4.59801 9.76221 4.0492 9.56143C3.50039 9.36064 2.99829 9.05005 2.57358 8.64864C2.14887 8.24722 1.81048 7.76342 1.5791 7.22679C1.34771 6.69016 1.22818 6.11198 1.22782 5.5276ZM10.2846 2.24995C10.3924 2.12782 10.4473 1.96786 10.4372 1.80527C10.427 1.64267 10.3527 1.49076 10.2306 1.38296C10.1084 1.27515 9.94849 1.22028 9.7859 1.23041C9.6233 1.24055 9.4714 1.31486 9.36359 1.43699L5.41237 5.90706L3.45794 4.3149C3.39545 4.26394 3.32353 4.22579 3.2463 4.20262C3.16906 4.17946 3.08802 4.17173 3.00779 4.17988C2.84578 4.19635 2.69694 4.2765 2.59402 4.40271C2.54305 4.4652 2.5049 4.53712 2.48173 4.61435C2.45857 4.69159 2.45084 4.77263 2.45899 4.85286C2.47546 5.01488 2.55561 5.16372 2.68182 5.26664L5.09431 7.2315C5.21721 7.3315 5.37401 7.38011 5.53193 7.36718C5.68985 7.35425 5.83665 7.28078 5.94165 7.16212L10.2846 2.24995Z"
      fill="black"
    />
  </svg>
);

const BellIcon = () => (
  <svg
    width="10"
    height="12"
    viewBox="0 0 10 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1.38155 3.45386C1.38155 1.54635 2.9279 0 4.83541 0C6.74291 0 8.28927 1.54635 8.28927 3.45386V5.52618L9.67082 6.90773V8.28927H0V6.90773L1.38155 5.52618V3.45386Z"
      fill="black"
    />
    <path
      d="M4.83526 11.0524C3.93296 11.0524 3.16535 10.4758 2.88086 9.6709H6.78967C6.50521 10.4758 5.73756 11.0524 4.83526 11.0524Z"
      fill="black"
    />
  </svg>
);

export default function ClassSession({
  role,
  lesson,
  childId,
  onSkip,
  onDelete,
}: Props) {
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showUploadTest, setShowUploadTest] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const navigate = useNavigate();
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
  const date = new Date(lesson.date_time).toLocaleString("ro-RO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const lessonDate = new Date(lesson.date_time);
  const today = new Date();
  const isToday =
    lessonDate.getDate() === today.getDate() &&
    lessonDate.getMonth() === today.getMonth() &&
    lessonDate.getFullYear() === today.getFullYear();

  async function cancelLesson(lessonId: number) {
    try {
      const response = await api.delete(
        `api/lessons/${lessonId}/cancel-lesson`,
      );
      if (response.status === 200 || response.status === 204) {
        if (onDelete) onDelete(lesson.id);
      }
    } catch (error: any) {
      console.log(error);
    }
  }

  const handleJoin = async () => {
    if (role === "teacher") {
      navigate(`/classroom/${lesson.id}`);
      return;
    }
    const student = lesson.classroom.students.find((s) => s.id === childId);
    const childName = student?.full_name;

    try {
      const response = await api.post(
        `/api/lessons/${lesson.id}/consume-credit/`,
        {
          child_id: childId,
        },
      );

      if (response.status === 200) {
        navigate(`/classroom/${lesson.id}`, {
          state: { childName, childId },
        });
      }
    } catch (err: any) {
      if (err.response && err.response.status === 402) {
        setShowNoCreditsModal(true);
      } else {
        console.error("Eroare la intrarea la oră:", err);
        alert("A apărut o eroare neașteptată.");
      }
    }
  };

  const handleSkipConfirmed = async () => {
    setIsSkipping(true);
    try {
      await api.post(`api/lessons/${lesson.id}/skip/`, { child_id: childId });
      setShowSkipConfirm(false);
      onSkip?.(lesson.id);
    } catch (err) {
      console.error("Skip failed:", err);
    } finally {
      setIsSkipping(false);
    }
  };

  return (
    <>
      {showSkipConfirm && (
        <ConfirmModal
          message="Esti sigur ca vrei sa treci peste aceasta lectie?"
          onConfirm={handleSkipConfirmed}
          onCancel={() => setShowSkipConfirm(false)}
        />
      )}

      {showUploadTest && (
        <UploadTestModal
          lessonId={lesson.id}
          onClose={() => setShowUploadTest(false)}
        />
      )}

      <div className="session-container">
        <div className="row-1">
          <div className="col-1">
            <p>{date}</p>
            <div className="title-container">
              <svg
                width="14"
                height="18"
                viewBox="0 0 14 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.89517 0C10.7032 0 13.7903 1.54354 13.7903 3.44758C13.7903 5.35162 10.7032 6.89517 6.89517 6.89517C3.08707 6.89517 0 5.35162 0 3.44758C0 1.54354 3.08707 0 6.89517 0Z"
                  fill="black"
                />
                <path
                  d="M12.7987 7.48155C13.122 7.31988 13.4597 7.12487 13.7903 6.89526V8.73396C13.7903 10.638 10.7032 12.1815 6.89517 12.1815C3.08707 12.1815 0 10.638 0 8.73396V6.89526C0.330646 7.12487 0.668348 7.31988 0.991674 7.48155C2.62127 8.29634 4.71167 8.73396 6.89517 8.73396C9.07866 8.73396 11.169 8.29634 12.7987 7.48155Z"
                  fill="black"
                />
                <path
                  d="M0 12.1814V14.0201C0 15.9242 3.08707 17.4677 6.89517 17.4677C10.7032 17.4677 13.7903 15.9242 13.7903 14.0201V12.1814C13.4597 12.411 13.122 12.606 12.7987 12.7677C11.169 13.5825 9.07866 14.0201 6.89517 14.0201C4.71167 14.0201 2.62127 13.5825 0.991674 12.7677C0.668348 12.606 0.330646 12.411 0 12.1814Z"
                  fill="black"
                />
              </svg>
              <h1 className="title-text">{lesson.classroom.titlu}</h1>
            </div>
            <p>{lesson.classroom.classroom_type}</p>
          </div>
          <div className="col-2">
            {lesson.classroom.students.map((student) => {
              // Verificăm dacă ID-ul acestui student se află în lista celor care au dat skip
              const hasSkipped = lesson.skipped_by?.includes(student.id);

              return (
                <div className="student-container" key={student.id}>
                  {!hasSkipped && <CheckIcon />}

                  <p className={hasSkipped ? "student-skipped" : ""}>
                    {student.full_name} {hasSkipped && "(Skipped)"}
                  </p>

                  {role === "teacher" && !hasSkipped && <BellIcon />}
                </div>
              );
            })}
          </div>
        </div>
        <div className="row-2">
          <div className="buttons-section">
            {role === "teacher" && (
              <button
                className="btn--outline--red"
                onClick={() => cancelLesson(lesson.id)}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.2341 3.2578C3.73837 3.35097 3.00777 4.19857 3.33017 4.52097L5.3118 6.50173L3.33017 8.4825C2.93367 8.879 4.12273 10.0668 4.51923 9.6707L6.50087 7.68993L8.4825 9.6707C8.879 10.0672 10.0676 8.87813 9.67157 8.4825L7.68993 6.50173L9.67157 4.52097C10.0681 4.12447 8.879 2.9367 8.4825 3.33277L6.50087 5.31353L4.51923 3.33277C4.44427 3.25867 4.34807 3.23613 4.2341 3.2578ZM6.5 0C2.90983 0 0 2.91027 0 6.5C0 10.0897 2.90983 13 6.5 13C10.0902 13 13 10.0897 13 6.5C13 2.91027 10.0902 0 6.5 0ZM6.5 1.625C9.1923 1.625 11.375 3.8077 11.375 6.5C11.375 9.1923 9.1923 11.375 6.5 11.375C3.8077 11.375 1.625 9.1923 1.625 6.5C1.62543 3.8077 3.8077 1.625 6.5 1.625Z"
                    fill="#FF0000"
                  />
                </svg>
                Anulare Lecție
              </button>
            )}

            {role === "parent" && (
              <button
                className="btn--outline"
                onClick={() => setShowSkipConfirm(true)}
                disabled={isSkipping}
              >
                <svg
                  width="8"
                  height="12"
                  viewBox="0 0 8 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.96875 5.625L2.8125 11.25V9.85828L6.69703 5.625L2.8125 1.38422V0L7.96875 5.625ZM5.15625 5.625L0 11.25V0L5.15625 5.625ZM0.9375 8.83969L3.88453 5.625L0.9375 2.41031V8.83969Z"
                    fill="#FF6116"
                  />
                </svg>
                Skip
              </button>
            )}

            {role === "teacher" && (
              <button
                className="btn--outline"
                onClick={() => setShowUploadTest(true)}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.8758 0.124178C12.7871 0.0354625 12.6638 -0.00937748 12.5386 0.00164208C12.4518 0.00931007 10.3953 0.205936 8.97791 1.62337C8.78321 1.81812 0.321662 10.2797 0.124199 10.4772C-0.0413995 10.6427 -0.0413995 10.9112 0.124199 11.0768L1.92321 12.8758C2.006 12.9586 2.11452 13 2.22304 13C2.33156 13 2.44008 12.9586 2.52286 12.8758L11.3766 4.02206C12.7941 2.60459 12.9907 0.548177 12.9983 0.461341C13.0094 0.336368 12.9645 0.212918 12.8758 0.124178ZM2.22307 11.9763L1.02371 10.777L1.62342 10.1773L2.82277 11.3766L2.22307 11.9763ZM9.87747 4.32189L8.67812 3.12254L9.2778 2.52286L10.4772 3.72222L9.87747 4.32189Z"
                    fill="#FF6116"
                  />
                </svg>
                Creare Test
              </button>
            )}

            <button
              className="btn--primary"
              onClick={handleJoin}
              // disabled={!isToday} // in development trebuie pus asta aici, momentan doar il comentez
            >
              <svg
                width="10"
                height="11"
                viewBox="0 0 10 11"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.86621 0.573059H8.59707V8.59623C8.59707 9.22926 8.08393 9.74241 7.4509 9.74241H2.86621"
                  stroke="white"
                  strokeWidth="1.14617"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4.58484 6.87721L6.3041 5.15795M6.3041 5.15795L4.58484 3.43872M6.3041 5.15795H0.573242"
                  stroke="white"
                  strokeWidth="1.14617"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {isToday ? "Intră" : "Indisponibil"}
            </button>
            {showNoCreditsModal && (
              <div className="modal-overlay">
                <div className="modal-box text-center">
                  <div style={{ fontSize: "50px" }}>
                    <svg
                      width="77"
                      height="77"
                      viewBox="0 0 77 77"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M28.875 54.5417C31.6033 52.5195 34.9214 51.3334 38.5 51.3334C42.0786 51.3334 45.3966 52.5195 48.125 54.5417"
                        stroke="#FF6116"
                        stroke-width="4.8125"
                        stroke-linecap="round"
                      />
                      <path
                        d="M48.1253 38.5C49.8972 38.5 51.3337 36.3454 51.3337 33.6875C51.3337 31.0296 49.8972 28.875 48.1253 28.875C46.3534 28.875 44.917 31.0296 44.917 33.6875C44.917 36.3454 46.3534 38.5 48.1253 38.5Z"
                        fill="#FF6116"
                      />
                      <path
                        d="M28.8753 38.5C30.6472 38.5 32.0837 36.3454 32.0837 33.6875C32.0837 31.0296 30.6472 28.875 28.8753 28.875C27.1034 28.875 25.667 31.0296 25.667 33.6875C25.667 36.3454 27.1034 38.5 28.8753 38.5Z"
                        fill="#FF6116"
                      />
                      <path
                        d="M70.5837 38.5C70.5837 53.624 70.5837 61.1864 65.8851 65.8847C61.1868 70.5833 53.6244 70.5833 38.5003 70.5833C23.3761 70.5833 15.814 70.5833 11.1155 65.8847C6.41699 61.1864 6.41699 53.624 6.41699 38.5C6.41699 23.3757 6.41699 15.8136 11.1155 11.1151C15.814 6.41663 23.3761 6.41663 38.5003 6.41663C53.6244 6.41663 61.1868 6.41663 65.8851 11.1151C69.0093 14.2392 70.0562 18.6293 70.4069 25.6666"
                        stroke="#FF6116"
                        stroke-width="4.8125"
                        stroke-linecap="round"
                      />
                    </svg>
                  </div>
                  <h3 className="modal-title">Credite insuficiente</h3>
                  <p>
                    Ne pare rău, dar nu mai ai credite disponibile pentru a
                    participa la această lecție. Te rugăm să îl contactezi pe
                    părintele tău pentru a reîncărca contul.
                  </p>
                  <div className="modal-actions">
                    <button
                      className="btn--primary"
                      onClick={() => setShowNoCreditsModal(false)}
                    >
                      Am înțeles
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
