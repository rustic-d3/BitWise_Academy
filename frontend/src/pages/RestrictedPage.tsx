import { useLocation, Navigate, Link } from "react-router-dom";
import "../styles/restricted.scss";

export default function RestrictedPage() {
  const location = useLocation();

  if (!location.state?.fromRestricted) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="restricted-wrapper">
      <div className="restricted-card">
        <div className="icon-box">
          <span className="lock-icon">
            <img src="/logo.svg" alt="Logo Bitwise" />
          </span>
        </div>
        <h1>Acces Restricționat</h1>
        <p>
          Ne pare rău, dar nu aveți permisiunile necesare pentru a accesa
          această secțiune.
        </p>
        <div className="actions">
          <Link to="/dashboard" className="btn-home">
            Înapoi la Acasă
          </Link>
          <Link to="/login" className="btn-login">
            Schimbă Contul
          </Link>
        </div>
      </div>
    </div>
  );
}
