import { useEffect, useState, useRef } from "react";
import AgoraRTC, {
  type ICameraVideoTrack,
  type IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import "../styles/video.scss";
import api from "../api";

AgoraRTC.setLogLevel(4);
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

interface Props {
  config: any;
  lessonId: string | undefined;
  childName?: string | null;
  teacherName?: string | null;
  participants?: Record<string, string>;
}

const MicIcon = ({ active }: { active: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="9" y="2" width="6" height="11" rx="3" fill="white" />
    <path
      d="M5 10C5 13.866 8.13401 17 12 17C15.866 17 19 13.866 19 10"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="12"
      y1="17"
      x2="12"
      y2="21"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="9"
      y1="21"
      x2="15"
      y2="21"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {!active && (
      <line
        x1="3"
        y1="3"
        x2="21"
        y2="21"
        stroke="#FF4444"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    )}
  </svg>
);

const CameraIcon = ({ active }: { active: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="2" y="7" width="13" height="10" rx="2" fill="white" />
    <path d="M15 11L21 8V16L15 13V11Z" fill="white" />
    {!active && (
      <line
        x1="3"
        y1="3"
        x2="21"
        y2="21"
        stroke="#FF4444"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    )}
  </svg>
);

export default function VideoComponent({
  config,
  lessonId,
  teacherName,
  participants,
}: Props) {
  const [localVideoTrack, setLocalVideoTrack] =
    useState<ICameraVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  // Aici folosim un ID specific pentru a ști EXACT peste care video facem hover
  const [hoveredUid, setHoveredUid] = useState<string | number | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const teacherVideoRef = useRef<HTMLDivElement | null>(null);
  const teacherVideoTrackRef = useRef<any>(null);
  const remoteVideoRefs = useRef<{ [uid: string]: HTMLDivElement | null }>({});
  const videoTracksRef = useRef<{ [uid: string]: any }>({});

  const teacherUid = config?.teacherUid;
  const isCurrentUserTeacher = config?.uid === teacherUid;
  const teacherRemote = remoteUsers.find((u) => u.uid === teacherUid);
  const studentRemotes = remoteUsers.filter((u) => u.uid !== teacherUid);

  const getParticipantName = (uid: string | number) => {
    if (uid === teacherUid) return teacherName || "Profesor";

    const name = participants?.[String(uid)];

    return name ? name : `Elev ${uid}`;
  };

  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      localVideoTrack.play(localVideoRef.current);
    }
  }, [localVideoTrack]);

  useEffect(() => {
    if (remoteUsers.length === 0 && localVideoTrack && lessonId) {
      api.post(`/api/lessons/${lessonId}/close-channel/`).catch((err) => {
        console.error("Could not close channel:", err);
      });
    }
  }, [remoteUsers]);

  useEffect(() => {
    let isActive = true;

    const setupCall = async () => {
      try {
        client.on("user-published", async (user, mediaType) => {
          try {
            await client.subscribe(user, mediaType);
          } catch {
            return;
          }

          if (mediaType === "video") {
            videoTracksRef.current[user.uid] = user.videoTrack;
            if (user.uid === teacherUid) {
              teacherVideoTrackRef.current = user.videoTrack;
            }
            setRemoteUsers((prev) =>
              prev.find((u) => u.uid === user.uid) ? prev : [...prev, user],
            );
          }

          if (mediaType === "audio") {
            user.audioTrack?.play();
          }
        });

        client.on("user-unpublished", (user) => {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        });

        client.on("user-left", (user) => {
          delete videoTracksRef.current[user.uid];
          if (user.uid === teacherUid) {
            teacherVideoTrackRef.current = null;
          }
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        });

        await client.join(
          config.appId,
          config.channel,
          config.token,
          config.uid,
        );

        if (!isActive) return;

        const [audioTrack, videoTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();

        if (!isActive) {
          audioTrack.close();
          videoTrack.close();
          return;
        }

        localVideoTrackRef.current = videoTrack;
        localAudioTrackRef.current = audioTrack;
        setLocalVideoTrack(videoTrack);
        await client.publish([audioTrack, videoTrack]);
      } catch (err) {
        console.error("Error during setup:", err);
      }
    };

    if (config) setupCall();

    return () => {
      isActive = false;
      localVideoTrackRef.current?.close();
      localAudioTrackRef.current?.close();
      client.removeAllListeners();
      client.leave();
    };
  }, [config]);

  const toggleCamera = async () => {
    if (!localVideoTrackRef.current) return;
    await localVideoTrackRef.current.setEnabled(!cameraOn);
    setCameraOn((prev) => !prev);
  };

  const toggleMic = async () => {
    if (!localAudioTrackRef.current) return;
    await localAudioTrackRef.current.setEnabled(!micOn);
    setMicOn((prev) => !prev);
  };

  return (
    <div className="main-container--video">
      {/* ======================= TEACHER VIDEO ======================= */}
      <div
        className="teacher-video-container video-hover-wrapper"
        onMouseEnter={() => setHoveredUid(teacherUid)}
        onMouseLeave={() => setHoveredUid(null)}
      >
        {isCurrentUserTeacher ? (
          <div ref={localVideoRef} style={{ width: "100%", height: "100%" }}>
            {!localVideoTrack && <p>Se încarcă camera...</p>}
          </div>
        ) : (
          <>
            <div
              style={{
                width: "100%",
                height: "100%",
                display: teacherRemote ? "block" : "none",
              }}
              ref={(node) => {
                teacherVideoRef.current = node;
                if (node && teacherVideoTrackRef.current) {
                  teacherVideoTrackRef.current.play(node);
                }
              }}
            />
            {!teacherRemote && <p>Profesorul nu s-a conectat încă...</p>}
          </>
        )}

        {/* Eticheta cu numele profesorului */}
        {hoveredUid === teacherUid && (
          <div className="video-name-tag">
            {isCurrentUserTeacher
              ? `${teacherName} (Tu)`
              : teacherName || "Profesor"}
          </div>
        )}
      </div>
      {/* Video copiilor */}
      <div className="children-video-container">
        {/* STUDENT LOCAL (Dacă utilizatorul curent este un elev) */}
        {!isCurrentUserTeacher && (
          <div
            className="child-video video-hover-wrapper"
            onMouseEnter={() => setHoveredUid(config.uid)}
            onMouseLeave={() => setHoveredUid(null)}
          >
            <div ref={localVideoRef} style={{ width: "100%", height: "100%" }}>
              {!localVideoTrack && <p>Se încarcă camera...</p>}
            </div>
            {hoveredUid === config.uid && (
              <div className="video-name-tag">
                {getParticipantName(config.uid)}
              </div>
            )}
          </div>
        )}

        {/* STUDENTS REMOTE (Ceilalți elevi din apel) */}
        {studentRemotes.map((user: IAgoraRTCRemoteUser) => (
          <div
            key={user.uid}
            className="child-video video-hover-wrapper"
            onMouseEnter={() => setHoveredUid(user.uid)}
            onMouseLeave={() => setHoveredUid(null)}
          >
            <div
              style={{ width: "100%", height: "100%" }}
              ref={(node) => {
                remoteVideoRefs.current[user.uid] = node;
                if (node && videoTracksRef.current[user.uid]) {
                  videoTracksRef.current[user.uid].play(node);
                }
              }}
            />
            {/* Afișăm ID-ul lor. Dacă vrei numele real, trebuie extras din backend */}
            {hoveredUid === user.uid && (
              <div className="video-name-tag">
                {getParticipantName(user.uid)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ======================= CONTROLS ======================= */}
      <div className="video-controls">
        <button
          className={`control-btn ${!micOn ? "control-btn--off" : ""}`}
          onClick={toggleMic}
          title={micOn ? "Dezactivează microfonul" : "Activează microfonul"}
        >
          <MicIcon active={micOn} />
        </button>
        <button
          className={`control-btn ${!cameraOn ? "control-btn--off" : ""}`}
          onClick={toggleCamera}
          title={cameraOn ? "Dezactivează camera" : "Activează camera"}
        >
          <CameraIcon active={cameraOn} />
        </button>
      </div>
    </div>
  );
}
