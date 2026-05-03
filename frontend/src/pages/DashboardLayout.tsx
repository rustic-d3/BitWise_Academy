import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { getUserRole } from "../helper-functions/DecodedToken";
import "../styles/dashboard.scss";

interface RoleBasedDashboards {
  children: ReactNode;
}

export default function DashboardLayout({ children }: RoleBasedDashboards) {
  const navigate = useNavigate();
  console.log(getUserRole());

  const handleJoin = () => {
    navigate("/room");
  };

  return (
    <div>
      {children}

      {/* <button
        onClick={handleJoin}
        className="px-6 py-2 rounded-md bg-[#BE3455] hover:bg-[#a82d4a] text-white text-sm font-medium transition-colors"
      >
        Join Session
      </button> */}
    </div>
  );
}
