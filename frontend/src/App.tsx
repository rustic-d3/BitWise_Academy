import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";

function LogOutAndRegister() {
  localStorage.clear();
  return <Register />;
}
function LogOutAndLogin() {
  localStorage.clear();
  return <Login />;
}

function App() {
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
                <Dashboard></Dashboard>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
