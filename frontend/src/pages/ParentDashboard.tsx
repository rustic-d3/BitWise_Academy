import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getUserRole } from "../helper-functions/DecodedToken";
import api from "../api";
import "../styles/dashboard.scss";
import type { LessonWithClassroom } from "../Types";
import ClassSession from "../components/ClassSession";
import InfoCard from "../components/InfoCard";

export default function ParentDashboard() {
  const role = getUserRole()?.toLowerCase() as "parent";
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [activeChild, setActiveChild] = useState<any>(null);
  const [activeChildClassroom, setActiveChildClassroom] = useState<any>(null);
  const [activeChildTeacher, setActiveChildTeacher] = useState<any>(null);
  const [allLessons, setAllLessons] = useState<LessonWithClassroom[]>([]);

  useEffect(() => {
    async function getParentData() {
      try {
        const response = await api.get("api/parent/profile");
        if (response.status === 200) {
          setChildren(response.data.children);
          localStorage.setItem("childrenNumber", response.data.children.length);
          setActiveChild(response.data.children[0]);
        }
      } catch (error) {
        console.error("Failed to fetch parent data:", error);
      } finally {
        setLoading(false);
      }
    }

    getParentData();
  }, []);

  useEffect(() => {
    if (!activeChild) return;

    async function getChildData() {
      setActiveChildClassroom(null);
      setActiveChildTeacher(null);
      setAllLessons([]);

      try {
        const response = await api.get(`api/child/${activeChild.id}/`);

        if (response.status === 200) {
          const classroom = response.data.classroom;

          if (classroom) {
            setActiveChildClassroom(classroom);
            setActiveChildTeacher(classroom.teacher);

            const lessons: LessonWithClassroom[] = classroom.lessons
              .map((lesson: any) => ({
                ...lesson,
                classroom: classroom,
              }))
              .sort(
                (a: any, b: any) =>
                  new Date(a.date_time).getTime() -
                  new Date(b.date_time).getTime(),
              );

            setAllLessons(lessons);
          }
        }
      } catch (error) {
        console.error("Failed to fetch child data:", error);
      }
    }

    getChildData();
  }, [activeChild]);

  const handleSkip = (lessonId: number) => {
    setAllLessons((prev) => prev.filter((l) => l.id !== lessonId));
  };

  if (loading) {
    return <div className="loading-spinner">Încărcăm datele...</div>;
  }

  return (
    <div className="page-wrapper">
      <Navbar role="parent" />
      {children.length === 0 && (
        <div className="no-data-container">
          <h1>
            Bine ai venit la Bitwise Academy, locul unde educația nu are limite!
          </h1>
          <p>
            Dacă ești gata pentru a începe, vă invităm să alegeți oferta
            preferată din pagina de{" "}
            <span>
              <a href="/subscriptions">oferte educaționale!</a>
            </span>
          </p>
        </div>
      )}
      {children.length > 0 && (
        <main className="main-content">
          <div className="left-side-container">
            <h2>Profesorul copilului:</h2>
            {!activeChildClassroom ? (
              <div className="queue-container">
                {activeChild.full_name} încă nu are atribuit un profesor.
                Reveniți mai târziu!
              </div>
            ) : (
              <InfoCard data={activeChildTeacher} />
            )}
            <div className="active-credits uninteractive-div">
              Total Lecții: {activeChild.credits}
            </div>
          </div>
          <div className="right-side-container">
            <div className="title-container">
              <h2>Următoarele Sesiuni:</h2>
              <div className="buttons-section">
                {children.map((child: any) => (
                  <button
                    key={child.id}
                    className={
                      activeChild?.id === child.id
                        ? "btn--users--active"
                        : "btn--users--outline"
                    }
                    onClick={() => setActiveChild(child)}
                  >
                    {child.full_name}
                  </button>
                ))}
              </div>
            </div>
            {!activeChildClassroom && (
              <div className="queue-container">
                {activeChild.full_name} încă nu a fost atribuit într-o clasă.
                Reveniți mai târziu!
              </div>
            )}
            {allLessons
              .filter((lesson) => !lesson.skipped_by.includes(activeChild.id))
              .map((lesson) => (
                <ClassSession
                  key={lesson.id}
                  role={role}
                  lesson={lesson}
                  childId={activeChild.id}
                  onSkip={handleSkip}
                />
              ))}
          </div>
        </main>
      )}
    </div>
  );
}
