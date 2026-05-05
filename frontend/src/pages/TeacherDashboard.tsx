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

  const allLessons: LessonWithClassroom[] = classrooms
    .flatMap((classroom) =>
      classroom.lessons.map((lesson) => ({
        ...lesson,
        classroom,
      })),
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
            <ClassSession key={lesson.id} role={role} lesson={lesson} />
          ))}
        </div>
      </main>
    </div>
  );
}
