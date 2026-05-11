import { useState } from "react";
import "../styles/_navbar.scss";
import handleLogout from "../helper-functions/Logout";

interface RoleProps {
  role: "teacher" | "parent";
}

export default function Navbar({ role }: RoleProps) {
  const isParent = role === "parent";
  const [menuOpen, setMenuOpen] = useState(false);
  const hasChildren = localStorage.getItem("childrenNumber") != "0";

  const links = (
    <>
      <li>
        <a href="/dashboard">Dashboard</a>{" "}
        {/* De schimbat aici mai tarziu la toate*/}
      </li>
      {isParent && hasChildren && (
        <li>
          <a href="#">Recuperare</a>
        </li>
      )}
      {isParent && hasChildren && (
        <li>
          <a href="#">Feedback-ul meu</a>
        </li>
      )}
      {isParent && !hasChildren && (
        <li>
          <a href="/subscriptions">Oferte</a>
        </li>
      )}
      {!isParent && (
        <li>
          <a href="#">Disponibilitate</a>
        </li>
      )}
      {!isParent && (
        <li>
          <a href="#">Feedback</a>
        </li>
      )}
    </>
  );

  return (
    <>
      <div className="nav-container">
        <div className="nav-section">
          <div className="left-side">
            <div className="image-container">
              <img src="/logo.png" alt="logo" />
            </div>
            <nav className="nav-links">
              <ul>{links}</ul>
            </nav>
          </div>
          <div className="right-side">
            <div className="mail-icon">
              <img src="/mail_icon.png" alt="mail" />
            </div>
            <button className="btn--outline" onClick={() => handleLogout()}>
              Delogare
            </button>
            <div className="personal-photo">
              <img src="/avatar.png" alt="avatar" />
            </div>
            {/* hamburger - mobile only */}
            <div
              className="nav-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>

      {/* mobile dropdown */}
      <div className={`nav-mobile-menu ${menuOpen ? "open" : ""}`}>
        <ul>{links}</ul>
      </div>
    </>
  );
}
