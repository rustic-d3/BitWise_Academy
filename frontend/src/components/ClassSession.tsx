import React from "react";
import "../styles/class_session.scss";

export default function ClassSession() {
  return (
    <div className="session-container">
      <div className="row-1">
        <div className="col-1">
          <p>Mie. 15, Apr 2026 | 8 PM - 9 PM</p>
          <div className="title-container">
            <h1>M1 | Alfabetizare Digitală</h1>
          </div>
          <p>RO: 6-7 ani</p>
        </div>
        <div className="col-2">
          <div className="student-container">
            <p>Popescu Andrei</p>
          </div>
          <div className="student-container">
            <p>Popescu Andrei</p>
          </div>
          <div className="student-container">
            <p>Popescu Andrei</p>
          </div>
          <div className="student-container">
            <p>Popescu Andrei</p>
          </div>
          <div className="student-container">
            <p>Popescu Andrei</p>
          </div>
        </div>
      </div>
      <div className="row-2">
        <div className="buttons-section">
          <button className="btn--outline">Skip</button>
          <button className="btn--primary">Intră</button>
        </div>
      </div>
    </div>
  );
}
