import React, { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";

import Register from "./pages/Register";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import ParentDashboard from "./pages/ParentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import TutoringLayout from "./components/TutoringLayout";
import { getUserRole } from "./helper-functions/DecodedToken";

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
  const role = getUserRole();

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Default redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          <Route path="/register" element={<LogOutAndRegister />} />
          <Route path="/login" element={<LogOutAndLogin />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                {role && role.toLowerCase() === "parent" && <ParentDashboard />}
                {role && role.toLowerCase() === "teacher" && <TeacherDashboard />}
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/room"
            element={
              <ProtectedRoute>
                <TutoringLayout />
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