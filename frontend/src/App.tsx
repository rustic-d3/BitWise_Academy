import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./pages/DashboardLayout";
import { useEffect, useState } from "react";
import ParentDashboard from "./pages/ParentDashboard";
import { jwtDecode } from "jwt-decode";
import TeacherDashboard from "./pages/TeacherDashboard";

interface JwtPayload {
  exp: number;
  role: string;
}

function LogOutAndRegister() {
  localStorage.clear();
  return <Register />;
}
function LogOutAndLogin() {
  useEffect(() => {
    localStorage.clear();
  }, []);

  return <Login />;
}

function App() {
  const [role, setRole] = useState(() => {
    const token = localStorage.getItem("access");
    if (!token) return "";
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.role;
  });

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<LogOutAndRegister />} />
          <Route path="/login" element={<LogOutAndLogin />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  {role.toLowerCase() === "parent" && <ParentDashboard />}
                  {role.toLowerCase() === "teacher" && <TeacherDashboard />}
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
