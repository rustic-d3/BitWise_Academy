import InfoCard from "../components/InfoCard";
import Navbar from "../components/Navbar";

export default function ParentDashboard() {
  return (
    <div className="page-wrapper">
      <Navbar role="parent" />
      <main className="main-content">
        <div className="left-side">
          <InfoCard></InfoCard>
        </div>
        <div className="right-side"></div>
      </main>
    </div>
  );
}
