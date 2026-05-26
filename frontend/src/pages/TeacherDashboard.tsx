import { useEffect, useState } from "react";
import ClassSession from "../components/ClassSession";
import Navbar from "../components/Navbar";
import { getUserRole } from "../helper-functions/DecodedToken";
import api from "../api";
import "../styles/dashboard.scss";
import InfoCard, { type InfoCardData } from "../components/InfoCard";
import type { Classroom, LessonWithClassroom } from "../Types";
import InfoModal from "../components/InfoModal";
import Pagination from "../components/Pagination";

// Interfața pentru răspunsul paginat returnat de Django REST Framework
interface PaginatedLessons {
  count: number;
  next: string | null;
  previous: string | null;
  results: LessonWithClassroom[];
}

export default function TeacherDashboard() {
  const role = getUserRole()?.toLowerCase() as "teacher";

  // State-uri pentru profilul profesorului
  const [teacherData, setTeacherData] = useState<InfoCardData | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  // State-uri pentru lecții și funcționalitatea de paginare
  const [lessons, setTeacherLessons] = useState<LessonWithClassroom[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  useEffect(() => {
    async function getTeacherData() {
      if (teacherData) return;
      try {
        const response = await api.get("api/teacher/profile");
        if (response.status === 200) {
          setTeacherData(response.data);
          setClassrooms(response.data.classrooms);
        }
      } catch (error) {
        console.error("Failed to fetch teacher data:", error);
      }
    }

    getTeacherData();
  }, []);

  useEffect(() => {
    async function getTeacherLessons() {
      try {
        const response = await api.get<PaginatedLessons>(
          `api/teacher/get_lessons/?page=${currentPage}`,
        );
        if (response.status === 200) {
          console.log(response.data);
          setTeacherLessons(response.data.results);

          setHasNext(response.data.next !== null);
          setHasPrev(response.data.previous !== null);

          setTotalPages(Math.ceil(response.data.count / 5));
        }
      } catch (error) {
        console.error("Failed to fetch teacher lessons:", error);
      }
    }

    getTeacherLessons();
  }, [currentPage]); // Se re-apelează automat când se modifică currentPage

  // Handler pentru ștergerea unei lecții din interfață
  const handleDeleteLesson = (lessonId: number) => {
    console.log("Lectie stearsa!");
    setTeacherLessons((prevLessons) =>
      prevLessons.filter((lesson) => lesson.id !== lessonId),
    );
  };

  // Handler pentru inițierea unui apel video (cu un student anume)
  const handleCall = async (studentId: number, lesson_id: number) => {
    try {
      const response = await api.post(
        `api/lessons/${lesson_id}/call/${studentId}/`,
      );
      const message =
        response.data?.status_message ||
        response.data?.message ||
        "Apelul a fost inițiat.";
      setModalMessage(message);
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        "A apărut o eroare la inițierea apelului.";
      setModalMessage(message);
    }
  };

  return (
    <>
      {modalMessage && (
        <InfoModal
          message={modalMessage}
          onCancel={() => setModalMessage(null)}
        />
      )}
      <div className="page-wrapper">
        <Navbar role="teacher" />
        <main className="main-content">
          <div className="left-side-container">
            {/* InfoCard primește datele decuplate ale profilului */}
            <InfoCard data={teacherData} />
          </div>

          <div className="right-side-container">
            <h2>Următoarele Sesiuni:</h2>

            {/* Gestionăm cazul în care pagina curentă nu are nicio lecție */}
            {lessons.length === 0 ? (
              <p>Nu ai nicio lecție programată pe această pagină.</p>
            ) : (
              lessons.map((lesson) => (
                <ClassSession
                  key={lesson.id}
                  role={role}
                  lesson={lesson} // Obiectul complet este pasat aici (conține și makeup_students și clasa normală)
                  onDelete={handleDeleteLesson}
                  onCall={handleCall}
                />
              ))
            )}

            {/* Componenta separată de paginare */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              hasNext={hasNext}
              hasPrev={hasPrev}
              onNext={() => setCurrentPage((prev) => prev + 1)}
              onPrev={() => setCurrentPage((prev) => prev - 1)}
            />
          </div>
        </main>
      </div>
    </>
  );
}
