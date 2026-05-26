import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getUserRole } from "../helper-functions/DecodedToken";
import api from "../api";
import "../styles/dashboard.scss";
import type { LessonWithClassroom } from "../Types";
import ClassSession from "../components/ClassSession";
import InfoCard from "../components/InfoCard";
import Pagination from "../components/Pagination"; // Nu uita să imporți componenta de paginare!

interface PaginatedLessons {
  count: number;
  next: string | null;
  previous: string | null;
  results: LessonWithClassroom[];
}

export default function ParentDashboard() {
  const role = getUserRole()?.toLowerCase() as "parent";
  const [loading, setLoading] = useState(true);

  // State-uri pentru Copii și Profil
  const [children, setChildren] = useState<any[]>([]);
  const [activeChild, setActiveChild] = useState<any>(null);
  const [activeChildClassroom, setActiveChildClassroom] = useState<any>(null);
  const [activeChildTeacher, setActiveChildTeacher] = useState<any>(null);

  // State-uri pentru Lecții și Paginare
  const [allLessons, setAllLessons] = useState<LessonWithClassroom[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  // 1. Fetch inițial pentru profilul părintelui și lista de copii
  useEffect(() => {
    async function getParentData() {
      try {
        const response = await api.get("api/parent/profile");
        if (response.status === 200) {
          setChildren(response.data.children);
          localStorage.setItem(
            "childrenNumber",
            response.data.children.length.toString(),
          );
          if (response.data.children.length > 0) {
            setActiveChild(response.data.children[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch parent data:", error);
      } finally {
        setLoading(false);
      }
    }
    getParentData();
  }, []);

  // 2. Fetch pentru datele STATICE ale copilului selectat (Clasă și Profesor)
  useEffect(() => {
    if (!activeChild) return;

    async function getChildStaticData() {
      try {
        const response = await api.get(`api/child/${activeChild.id}/`);
        if (response.status === 200) {
          const classroom = response.data.classroom;
          if (classroom) {
            setActiveChildClassroom(classroom);
            setActiveChildTeacher(classroom.teacher);
          } else {
            setActiveChildClassroom(null);
            setActiveChildTeacher(null);
            setAllLessons([]); // Dacă nu are clasă, sigur nu are nici lecții
          }
        }
      } catch (error) {
        console.error("Failed to fetch child static data:", error);
      }
    }

    getChildStaticData();
  }, [activeChild]);

  // 3. Fetch separat pentru LECȚIILE paginate ale copilului
  useEffect(() => {
    // Nu cerem lecții dacă nu avem copil sau copilul nu e într-o clasă
    if (!activeChild || !activeChildClassroom) return;

    async function getChildLessons() {
      try {
        // Apelăm noul endpoint care va returna lecțiile paginate
        const response = await api.get<PaginatedLessons>(
          `api/child/${activeChild.id}/lessons/?page=${currentPage}`,
        );

        if (response.status === 200) {
          setAllLessons(response.data.results);
          setHasNext(response.data.next !== null);
          setHasPrev(response.data.previous !== null);
          setTotalPages(Math.ceil(response.data.count / 5));
        }
      } catch (error) {
        console.error("Failed to fetch child lessons:", error);
      }
    }

    getChildLessons();
  }, [activeChild, activeChildClassroom, currentPage]); // Se re-apelează când se schimbă pagina sau copilul

  // Handler pentru schimbarea copilului din meniu
  const handleChildSelection = (child: any) => {
    setActiveChild(child);
    setCurrentPage(1); // RESETĂM PAGINA la 1 când schimbăm copilul!
  };

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
                    onClick={() => handleChildSelection(child)} 
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

            {activeChildClassroom && allLessons.length === 0 && (
              <p>Nu există nicio lecție programată pe această pagină.</p>
            )}

            {activeChildClassroom &&
              allLessons
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

            {/* Componenta de Paginare afișată doar dacă are o clasă activă */}
            {activeChildClassroom && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                hasNext={hasNext}
                hasPrev={hasPrev}
                onNext={() => setCurrentPage((prev) => prev + 1)}
                onPrev={() => setCurrentPage((prev) => prev - 1)}
              />
            )}
          </div>
        </main>
      )}
    </div>
  );
}
