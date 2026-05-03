import ClassSession from "../components/ClassSession";
import InfoCard from "../components/InfoCard";
import Navbar from "../components/Navbar";
import { getUserRole } from "../helper-functions/DecodedToken";

export default function TeacherDashboard() {
  console.log(getUserRole());
  return (
    <div className="page-wrapper">
      <Navbar role="teacher" />
      <main className="main-content">
        <div className="left-side-container">
          <InfoCard></InfoCard>
        </div>
        <div className="right-side-container">
          <ClassSession />
          <ClassSession />
          <ClassSession />
        </div>
      </main>
    </div>
  );
}
