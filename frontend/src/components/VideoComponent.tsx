import React from "react";
import "../styles/video.scss";

export default function VideoComponent() {
  return (
    <div className="main-container--video">
      <div className="teacher-video-container">
        {/* Teacher video container */}
      </div>
      <div className="children-video-container">
        <div className="child-video"></div>
        <div className="child-video"></div>
        <div className="child-video"></div>
        <div className="child-video"></div>
        <div className="child-video"></div>
      </div>
    </div>
  );
}
