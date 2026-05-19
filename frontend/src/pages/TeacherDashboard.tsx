import { useEffect, useState } from "react";
import ClassSession from "../components/ClassSession";
import Navbar from "../components/Navbar";
import { getUserRole } from "../helper-functions/DecodedToken";
import api from "../api";
import "../styles/dashboard.scss";
import InfoCard, { type InfoCardData } from "../components/InfoCard";
import type { Classroom, LessonWithClassroom } from "../Types";

export default function TeacherDashboard() {
  const role = getUserRole()?.toLowerCase() as "teacher";

  const [teacherData, setTeacherData] = useState<InfoCardData | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  useEffect(() => {
    async function getTeacherData() {
      if (teacherData) return;
      try {
        const response = await api.get("api/teacher/profile");
        if (response.status === 200) {
          setTeacherData(response.data);
          setClassrooms(response.data.classrooms);
          console.log(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch teacher data:", error);
      }
    }

    getTeacherData();
  }, []);

  const handleDeleteLesson = (lessonId: number) => {
    console.log("Lectie stearsa!");
    setClassrooms((prevClassrooms) =>
      prevClassrooms.map((classroom) => ({
        ...classroom,
        lessons: classroom.lessons.filter((lesson) => lesson.id !== lessonId),
      })),
    );
  };

  const allLessons: LessonWithClassroom[] = classrooms
    .flatMap((classroom) =>
      classroom.lessons.map((lesson) => {
        // Logica de filtrare: Dacă e recuperare, păstrăm doar elevii programați
        const displayedStudents = lesson.is_makeup
          ? classroom.students.filter((student: any) =>
              lesson.makeup_students?.includes(student.id),
            )
          : classroom.students; // Dacă e lecție normală, îi lăsăm pe toți

        return {
          ...lesson,
          classroom: {
            ...classroom,
            students: displayedStudents, // Suprascriem lista de studenți doar pentru această lecție
          },
        };
      }),
    )
    .sort(
      (a, b) =>
        new Date(a.date_time).getTime() - new Date(b.date_time).getTime(),
    );

  return (
    <div className="page-wrapper">
      <Navbar role="teacher" />
      <main className="main-content">
        <div className="left-side-container">
          <InfoCard data={teacherData} />
        </div>
        <div className="right-side-container">
          <h2>Următoarele Sesiuni:</h2>
          {allLessons.map((lesson) => (
            <ClassSession
              key={lesson.id}
              role={role}
              lesson={lesson}
              onDelete={handleDeleteLesson}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
