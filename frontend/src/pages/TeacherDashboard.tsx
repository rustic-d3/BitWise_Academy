import { useEffect, useState } from "react";
import ClassSession from "../components/ClassSession";
import InfoCard from "../components/InfoCard";
import Navbar from "../components/Navbar";
import { getUserRole } from "../helper-functions/DecodedToken";
import api from "../api";

export default function TeacherDashboard() {
  const role = getUserRole()?.toLowerCase() as "teacher";

  const [teacherData, setTeacherData] = useState({});

  useEffect(() => {
    async function getTeacherData() {
      const response = await api.get("api/teacher/profile");
      if (response.statusText === "OK") {
        setTeacherData(response.data);
        console.log(response.data);
      }
    }

    getTeacherData();
  }, []);

  return (
    <div className="page-wrapper">
      <Navbar role="teacher" />
      <main className="main-content">
        <div className="left-side-container">
          <InfoCard></InfoCard>
        </div>
        <div className="right-side-container">
          <ClassSession role={role} />
          <ClassSession role={role} />
          <ClassSession role={role} />
          <ClassSession role={role} />
          <ClassSession role={role} />
        </div>
      </main>
    </div>
  );
}
