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

  async function startTest() {
    try {
      await api.post(`/api/lessons/${lessonId}/start-test/`);
      setTestOn(true);
    } catch (err) {
      console.error("Eroare la pornirea testului:", err);
      alert("Nu s-a putut porni testul.");
    }
  }
  const endTest = () => {
    setTestOn(false);
    setTestCompleted(true);
  };

  useEffect(() => {
    const fetchSessionPass = async () => {
      try {
        const response = await api.get(`/api/lessons/${lessonId}/join/`);
        setAgoraConfig(response.data.agora_data);
        setParticipants(response.data.agora_data.participants);
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
                    strokeWidth="1.26168"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
          <VideoComponent
            config={agoraConfig}
            lessonId={lessonId}
            childName={childName}
            teacherName={agoraConfig?.teacherName ?? null}
            participants={participants}
          />
        </div>
        <div className="right-side-container--classroom">
          <div className="row--1">
            <div className="buttons-section">
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
              <button className="btn--outline--nohover">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 17 17"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_1_2836)">
                    <path
                      d="M4.20377 1.54813L1.54752 4.20438L0.0449219 2.70178L2.70118 0.0455322L4.20377 1.54813Z"
                      fill="#FF6116"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M15.4056 9.03125C15.4056 10.418 14.9968 11.7094 14.2933 12.7913L16.6881 15.1862L15.1855 16.6888L12.873 14.3763C11.6821 15.352 10.1591 15.9375 8.4993 15.9375C6.83957 15.9375 5.31658 15.352 4.1256 14.3763L1.81314 16.6888L0.310547 15.1862L2.7054 12.7913C2.0018 11.7094 1.59305 10.418 1.59305 9.03125C1.59305 5.21703 4.68508 2.125 8.4993 2.125C12.3135 2.125 15.4056 5.21703 15.4056 9.03125ZM7.43689 5.31247V10.0026L9.8731 12.4388L11.3757 10.9362L9.56189 9.12237V5.31247H7.43689Z"
                      fill="#FF6116"
                    />
                    <path
                      d="M15.4512 4.20451L12.7949 1.54826L14.2975 0.0456543L16.9538 2.7019L15.4512 4.20451Z"
                      fill="#FF6116"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_1_2836">
                      <rect width="17" height="17" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                59 : 48
              </button>
            </div>
          </div>
          <div className="row--2">
            {/* 
              Verificăm dacă `agoraConfig` există ȘI dacă are secțiunea de `whiteboard`
              Dacă da, transmitem props-urile către WhiteBoard. Dacă nu, afișăm un text de loading.
            */}
            {agoraConfig && agoraConfig.whiteboard && !testOn ? (
              <WhiteBoard
                uuid={agoraConfig.whiteboard.uuid}
                token={agoraConfig.whiteboard.token}
                appIdentifier={agoraConfig.whiteboard.appIdentifier}
                region={agoraConfig.whiteboard.region}
                uid={agoraConfig.uid.toString()}
              />
            ) : testOn ? (
              <TestComponent
                lessonId={lessonId ? Number(lessonId) : undefined}
                userRole={user_role}
                childId={childId}
                closeTest={endTest}
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
