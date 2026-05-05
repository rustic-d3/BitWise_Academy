import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getUserRole } from "../helper-functions/DecodedToken";
import api from "../api";
import "../styles/dashboard.scss";
import type { Classroom, LessonWithClassroom } from "../Types";

export default function ParentDashboard() {
  const role = getUserRole()?.toLowerCase() as "parent";

  const [parentData, setParentData] = useState(null);
  const [children, setChildren] = useState<any[]>([]);
  const [activeChild, setActiveChild] = useState<any>(null);
  const [activeChildClassroom, setActiveChildClassroom] = useState<any[]>([]);

  useEffect(() => {
    async function getParentData() {
      try {
        const response = await api.get("api/parent/profile");
        if (response.status === 200) {
          setParentData(response.data);
          setChildren(response.data.children);
          setActiveChild(response.data.children[0]);
        }
      } catch (error) {
        console.error("Failed to fetch parent data:", error);
      }
    }

    getParentData();
  }, []);

  useEffect(() => {
    if (!activeChild) return;

    async function getChildData() {
      try {
        const response = await api.get(`api/child/${activeChild.id}/`);
        if (response.status === 200) {
          console.log(response.data);
          setActiveChildClassroom(response.data.classroom);
        }
      } catch (error) {
        console.error("Failed to fetch child data:", error);
      }
    }

    getChildData();
  }, [activeChild]);

  return (
    <div className="page-wrapper">
      <Navbar role="parent" />
      <main className="main-content">
        <div className="left-side-container"></div>
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
        </div>
      </main>
    </div>
  );
}
