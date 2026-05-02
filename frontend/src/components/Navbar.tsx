import React from "react";
import "../styles/_navbar.scss";
interface RoleProps {
  role: "teacher" | "parent";
}

export default function Navbar({ role }: RoleProps) {
  const isParent = role == "parent";
  return (
    <div className="nav-container">
      <div className="left-side">
        <div className="image-container">
          <img src="/logo.png" alt="" />
        </div>
        <nav className="nav-links">
          <ul>
            <li>
              <a href="">Dashboard</a>
            </li>
            {isParent && (
              <li>
                <a href="#">Recuperare</a>
              </li>
            )}
            {isParent && (
              <li>
                <a href="#">Feedback-ul</a>
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
          </ul>
        </nav>
      </div>
      <div className="right-side">
        <div className="mail-icon">
          <img src="/mail_icon.png" alt="mail" />
        </div>
        <button className="btn ">Delogare</button>
        <div className="personal-photo">
          <img src="/avatar.png" alt="avatar" />
        </div>
      </div>
    </div>
  );
}
