import React from "react";
import Navbar from "../components/Navbar";
import Video from "../components/VideoComponent";
import "../styles/classroom.scss";
import VideoComponent from "../components/VideoComponent";

export default function Classroom() {
  return (
    <div className="page-wrapper">
      <Navbar role="parent" />
      <main className="main-content">
        <div className="left-side-container--classroom">
          <div className="buttons-section">
            <div className="buttons-container-left">
              <button className="btn--primary">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 13 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.41591 10.0935V11.986M8.20095 10.0935V11.986M3.15422 11.986H9.46263M0.630859 6.30843H11.986M6.30843 8.20095H6.31474M2.64955 10.0935H9.96731C10.6739 10.0935 11.0272 10.0935 11.2971 9.95595C11.5345 9.83502 11.7275 9.64198 11.8485 9.4046C11.986 9.13472 11.986 8.78139 11.986 8.07478V2.64955C11.986 1.94295 11.986 1.58964 11.8485 1.31975C11.7275 1.08235 11.5345 0.889334 11.2971 0.768376C11.0272 0.630859 10.6739 0.630859 9.96731 0.630859H2.64955C1.94295 0.630859 1.58964 0.630859 1.31975 0.768376C1.08235 0.889334 0.889334 1.08235 0.768376 1.31975C0.630859 1.58964 0.630859 1.94294 0.630859 2.64955V8.07478C0.630859 8.78139 0.630859 9.13472 0.768376 9.4046C0.889334 9.64198 1.08235 9.83502 1.31975 9.95595C1.58964 10.0935 1.94294 10.0935 2.64955 10.0935Z"
                    stroke="white"
                    stroke-width="1.26168"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
              <button className="btn--users--chat">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 13 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clip-path="url(#clip0_1_2975)">
                    <path
                      d="M8.93629 1.75481C8.16304 1.30751 7.2653 1.05151 6.30779 1.05151C3.40442 1.05151 1.05078 3.40516 1.05078 6.30852C1.05078 7.14949 1.24824 7.94429 1.59933 8.64921C1.69263 8.83651 1.72368 9.05063 1.66959 9.25276L1.35648 10.423C1.22056 10.931 1.68531 11.3957 2.19331 11.2598L3.36354 10.9467C3.5657 10.8926 3.77981 10.9237 3.96712 11.017C4.672 11.3681 5.46683 11.5655 6.30779 11.5655C9.21113 11.5655 11.5648 9.21186 11.5648 6.30852C11.5648 5.35101 11.3088 4.45326 10.8615 3.68002"
                      stroke="#FF6116"
                      stroke-width="1.40187"
                      stroke-linecap="round"
                    />
                  </g>
                  <rect
                    x="0.0140187"
                    y="0.0140187"
                    width="12.5888"
                    height="12.5888"
                    stroke="#FF6116"
                    stroke-width="0.0280374"
                  />
                  <defs>
                    <clipPath id="clip0_1_2975">
                      <rect width="12.6168" height="12.6168" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </button>
            </div>
            <div className="buttons-container-right">
              <button className="btn--outline">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.8758 0.124178C12.7871 0.0354625 12.6638 -0.00937748 12.5386 0.00164208C12.4518 0.00931007 10.3953 0.205936 8.97791 1.62337C8.78321 1.81812 0.321662 10.2797 0.124199 10.4772C-0.0413995 10.6427 -0.0413995 10.9112 0.124199 11.0768L1.92321 12.8758C2.006 12.9586 2.11452 13 2.22304 13C2.33156 13 2.44008 12.9586 2.52286 12.8758L11.3766 4.02206C12.7941 2.60459 12.9907 0.548177 12.9983 0.461341C13.0094 0.336368 12.9645 0.212918 12.8758 0.124178ZM2.22307 11.9763L1.02371 10.777L1.62342 10.1773L2.82277 11.3766L2.22307 11.9763ZM9.87747 4.32189L8.67812 3.12254L9.2778 2.52286L10.4772 3.72222L9.87747 4.32189Z"
                    fill="#FF6116"
                  />
                </svg>
                Începe Testul
              </button>
            </div>
          </div>
          {/* Chat/Video */}
          <VideoComponent />
        </div>
        <div className="right-side-container--classroom"></div>
      </main>
    </div>
  );
}
