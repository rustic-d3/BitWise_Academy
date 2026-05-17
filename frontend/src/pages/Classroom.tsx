import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import "../styles/classroom.scss";
import VideoComponent from "../components/VideoComponent";
import { useNavigate, useParams } from "react-router-dom";
import WhiteBoard from "../components/WhiteBoard";
import api from "../api";
import { getUserRole } from "../helper-functions/DecodedToken";
import TestComponent from "../components/TestComponent";
import { useLocation } from "react-router-dom";
import LessonTimer from "../components/LessonTimer";
import ConfirmModal from "../components/ConfirmModal";
import ScreenPlayer from "../components/ScreenPlayer";
import ChatComponent from "../components/ChatComponent";

export default function Classroom() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [agoraConfig, setAgoraConfig] = React.useState<any>(null);
  const navigate = useNavigate();
  const user_role = getUserRole() || "";
  const [testOn, setTestOn] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const location = useLocation();
  const childName = location.state?.childName ?? null;
  const childId = location.state?.childId ?? null;
  const [participants, setParticipants] = useState<Record<string, string>>({});
  const [lessonStartTime, setLessonStartTime] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeScreenTrack, setActiveScreenTrack] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  async function startTest() {
    try {
      await api.post(`/api/lessons/${lessonId}/start-test/`);
      setTestOn(true);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        alert(err.response.data.error);
      } else {
        console.error("Eroare la pornirea testului:", err);
        alert("Nu s-a putut porni testul din cauza unei erori de server.");
      }
    }
  }
  const endTest = () => {
    setTestOn(false);
    setTestCompleted(true);
  };
  async function handleEndlessonConfirmed() {
    try {
      const response = await api.post(
        `api/lessons/${lessonId}/end-and-report/`,
      );
      setShowConfirmModal(false);
      console.log(response);
    } catch (err) {
      console.error("Ending lesson failed:", err);
    }
  }

  useEffect(() => {
    const fetchSessionPass = async () => {
      try {
        const response = await api.get(`/api/lessons/${lessonId}/join/`);
        setAgoraConfig(response.data.agora_data);
        setParticipants(response.data.agora_data.participants);
        setLessonStartTime(response.data.date_time);
      } catch (err) {
        console.error("Could not join session", err);
      }
    };
    if (lessonId) fetchSessionPass();
  }, [lessonId]);

  useEffect(() => {
    if (user_role === "teacher" || testOn || testCompleted) return;

    const checkTestStatus = async () => {
      try {
        const response = await api.get(`/api/lessons/${lessonId}/test-status/`);

        if (response.data.is_test_active) {
          setTestOn(true);
          console.log("testul a inceput!");
        }
      } catch (err) {
        console.error("Eroare la verificarea statusului testului:", err);
      }
    };

    const interval = setInterval(checkTestStatus, 3000);

    return () => clearInterval(interval);
  }, [lessonId, user_role, testOn]);

  useEffect(() => {
    // Dacă e profesor, nu are sens să marcăm prezența ca elev
    if (user_role === "teacher" || !childId || !agoraConfig) return;

    const markPresence = async () => {
      try {
        await api.post(`/api/lessons/${lessonId}/mark-attendance/`, {
          child_id: childId,
        });
        console.log("Prezența ta a fost înregistrată automat!");
      } catch (err) {
        console.error("Eroare la marcarea prezenței:", err);
      }
    };

    markPresence();
  }, [lessonId, childId, user_role, agoraConfig]);

  useEffect(() => {
    if (user_role !== "teacher" || !testOn) return;
    const syncTestStatus = async () => {
      try {
        const response = await api.get(`/api/lessons/${lessonId}/test-status/`);
        if (response.data.is_test_active === false) {
          setTestOn(false);
          alert("Toți elevii prezenți au finalizat testul. Revenim la lecție!");
        }
      } catch (err) {
        console.error("Eroare la sincronizarea statusului testului", err);
      }
    };

    const interval = setInterval(syncTestStatus, 3000);

    return () => clearInterval(interval);
  }, [lessonId, user_role, testOn]);

  return (
    <div className="page-wrapper">
      <Navbar role={user_role} />
      <main className="main-content">
        {showConfirmModal && (
          <ConfirmModal
            message="Esti sigur ca vrei să închizi ora? Asta va declanșa trimiterea rapoartelor către părinți"
            onConfirm={handleEndlessonConfirmed}
            onCancel={() => setShowConfirmModal(false)}
          />
        )}
        <div className="left-side-container--classroom">
          <div className="buttons-section">
            <div className="buttons-container-left">
              <button
                className="btn--primary"
                onClick={() => setChatOpen(false)}
              >
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
                    strokeWidth="1.26168"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                className="btn--users--chat"
                onClick={() => setChatOpen(true)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 13 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_1_2975)">
                    <path
                      d="M8.93629 1.75481C8.16304 1.30751 7.2653 1.05151 6.30779 1.05151C3.40442 1.05151 1.05078 3.40516 1.05078 6.30852C1.05078 7.14949 1.24824 7.94429 1.59933 8.64921C1.69263 8.83651 1.72368 9.05063 1.66959 9.25276L1.35648 10.423C1.22056 10.931 1.68531 11.3957 2.19331 11.2598L3.36354 10.9467C3.5657 10.8926 3.77981 10.9237 3.96712 11.017C4.672 11.3681 5.46683 11.5655 6.30779 11.5655C9.21113 11.5655 11.5648 9.21186 11.5648 6.30852C11.5648 5.35101 11.3088 4.45326 10.8615 3.68002"
                      stroke="#FF6116"
                      strokeWidth="1.40187"
                      strokeLinecap="round"
                    />
                  </g>
                  <rect
                    x="0.0140187"
                    y="0.0140187"
                    width="12.5888"
                    height="12.5888"
                    stroke="#FF6116"
                    strokeWidth="0.0280374"
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
              {user_role === "teacher" && !testCompleted && (
                <button
                  className="btn--outline"
                  onClick={() => {
                    startTest();
                  }}
                >
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
              )}
            </div>
          </div>
          {/* Chat/Video */}
          {chatOpen ? (
            <ChatComponent
              currentUser={user_role === "teacher" ? "Profesor" : childName}
              config={agoraConfig}
              messages={chatMessages} // Îi dăm memoria
              setMessages={setChatMessages}
            />
          ) : (
            <VideoComponent
              config={agoraConfig}
              lessonId={lessonId}
              childName={childName}
              teacherName={agoraConfig?.teacherName ?? null}
              onScreenTrackChange={(track) => setActiveScreenTrack(track)}
              participants={participants}
            />
          )}
        </div>
        <div className="right-side-container--classroom">
          <div className="row--1">
            <div className="buttons-section">
              {user_role === "teacher" && (
                <button
                  className="btn--outline"
                  onClick={() => setShowConfirmModal(true)}
                >
                  <svg
                    width="8"
                    height="12"
                    viewBox="0 0 8 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.96875 5.625L2.8125 11.25V9.85828L6.69703 5.625L2.8125 1.38422V0L7.96875 5.625ZM5.15625 5.625L0 11.25V0L5.15625 5.625ZM0.9375 8.83969L3.88453 5.625L0.9375 2.41031V8.83969Z"
                      fill="#FF6116"
                    />
                  </svg>
                  Încheie lecția
                </button>
              )}
              <button
                className="btn--primary"
                onClick={() => navigate("/dashboard")}
              >
                <svg
                  width="10"
                  height="11"
                  viewBox="0 0 10 11"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.86621 0.573059H8.59707V8.59623C8.59707 9.22926 8.08393 9.74241 7.4509 9.74241H2.86621"
                    stroke="white"
                    strokeWidth="1.14617"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4.58484 6.87721L6.3041 5.15795M6.3041 5.15795L4.58484 3.43872M6.3041 5.15795H0.573242"
                    stroke="white"
                    strokeWidth="1.14617"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Părăsește ora
              </button>
              {lessonStartTime && (
                <LessonTimer startTime={lessonStartTime} durationMinutes={60} />
              )}
            </div>
          </div>
          <div className="row--2">
            {testOn ? (
              <TestComponent
                lessonId={lessonId ? Number(lessonId) : undefined}
                userRole={user_role}
                childId={childId}
                closeTest={endTest}
              />
            ) : activeScreenTrack ? (
              // DACĂ AVEM ECRAN, ÎL AFIȘĂM PESTE TABLĂ
              <ScreenPlayer track={activeScreenTrack} />
            ) : agoraConfig && agoraConfig.whiteboard ? (
              <WhiteBoard
                uuid={agoraConfig.whiteboard.uuid}
                token={agoraConfig.whiteboard.token}
                appIdentifier={agoraConfig.whiteboard.appIdentifier}
                region={agoraConfig.whiteboard.region}
                uid={agoraConfig.uid.toString()}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                Se încarcă tabla interactivă...
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
