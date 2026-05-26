import { useEffect, useState, useRef } from "react";
import AgoraRTC, {
  type ICameraVideoTrack,
  type IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import "../styles/video.scss";
import api from "../api";

AgoraRTC.setLogLevel(4);

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
const screenClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

interface Props {
  config: any;
  lessonId: string | undefined;
  childName?: string | null;
  teacherName?: string | null;
  participants?: Record<string, string>;
  onScreenTrackChange?: (track: any | null) => void;
}

const MicIcon = ({ active }: { active: boolean }) => (
  <svg
    width="13"
    height="13"
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
    width="13"
    height="13"
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

const ScreenShareIcon = ({ active }: { active: boolean }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="8" y1="21" x2="16" y2="21"></line>
    <line x1="12" y1="17" x2="12" y2="21"></line>
    {active && (
      <line x1="3" y1="3" x2="21" y2="21" stroke="#FF4444" strokeWidth="2.5" />
    )}
  </svg>
);

const CameraOffAvatar = () => (
  <div className="camera-off-overlay">
    <svg
      width="30"
      height="45"
      viewBox="0 0 30 45"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 23.2207C21.4113 23.2207 26.6094 18.0226 26.6094 11.6103C26.6094 5.19994 21.4113 0 15 0C8.58785 0 3.39062 5.19994 3.39062 11.6103C3.39062 18.0226 8.58785 23.2207 15 23.2207Z"
        fill="#FF6116"
      />
      <path
        d="M29.868 34.4059C29.3497 31.3011 26.7171 27.0093 24.8308 25.0002C24.3207 24.4565 23.435 24.6826 23.1238 24.8753C20.7571 26.3345 17.979 27.1858 14.9999 27.1858C12.021 27.1858 9.24283 26.3345 6.8762 24.8753C6.56506 24.6826 5.67932 24.4565 5.16906 25.0002C3.28293 27.0093 0.650402 31.3011 0.132001 34.4059C-1.14164 42.0501 7.02464 44.812 15 44.812C22.9754 44.812 31.1417 42.0501 29.868 34.4059Z"
        fill="#FF6116"
      />
    </svg>
  </div>
);

export default function VideoComponent({
  config,
  lessonId,
  teacherName,
  participants,
  onScreenTrackChange,
}: Props) {
  const [localVideoTrack, setLocalVideoTrack] =
    useState<ICameraVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [cameraOffUsers, setCameraOffUsers] = useState<Set<string | number>>(
    new Set(),
  );
  const [hoveredUid, setHoveredUid] = useState<string | number | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSomeoneElseSharing, setIsSomeoneElseSharing] = useState(false);

  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<any>(null);
  const screenTrackRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const teacherVideoRef = useRef<HTMLDivElement | null>(null);
  const teacherVideoTrackRef = useRef<any>(null);
  const remoteVideoRefs = useRef<{ [uid: string]: HTMLDivElement | null }>({});
  const videoTracksRef = useRef<{ [uid: string]: any }>({});

  const teacherUid = config?.teacherUid;
  const isCurrentUserTeacher = config?.uid === teacherUid;
  const teacherRemote = remoteUsers.find((u) => u.uid === teacherUid);
  const studentRemotes = remoteUsers.filter(
    (u) => u.uid !== teacherUid && Number(u.uid) < 100000,
  );

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
  }, [remoteUsers, localVideoTrack, lessonId]);

  useEffect(() => {
    let isActive = true;

    const setupCall = async () => {
      try {
        client.on("user-published", async (user, mediaType) => {
          const myScreenUid = Number(config.uid) + 100000;
          if (user.uid === myScreenUid) return;

          try {
            await client.subscribe(user, mediaType);
          } catch {
            return;
          }

          if (Number(user.uid) >= 100000) {
            setIsSomeoneElseSharing(true);
            if (mediaType === "video" && onScreenTrackChange) {
              onScreenTrackChange(user.videoTrack);
            }
            return;
          }

          if (mediaType === "video") {
            videoTracksRef.current[user.uid] = user.videoTrack;

            // Userul și-a reactivat camera — scoate-l din cameraOffUsers
            setCameraOffUsers((prev) => {
              const next = new Set(prev);
              next.delete(user.uid);
              return next;
            });

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

        client.on("user-unpublished", (user, mediaType) => {
          if (Number(user.uid) >= 100000 && onScreenTrackChange) {
            setIsSomeoneElseSharing(false);
            onScreenTrackChange(null);
            return;
          }

          if (mediaType === "video") {
            // Nu scoate userul din listă — doar marchează-l ca fără cameră
            delete videoTracksRef.current[user.uid];
            if (user.uid === teacherUid) teacherVideoTrackRef.current = null;
            setCameraOffUsers((prev) => new Set(prev).add(user.uid));
          }
        });

        client.on("user-left", (user) => {
          if (Number(user.uid) >= 100000 && onScreenTrackChange) {
            setIsSomeoneElseSharing(false);
            onScreenTrackChange(null);
            return;
          }

          delete videoTracksRef.current[user.uid];
          if (user.uid === teacherUid) teacherVideoTrackRef.current = null;

          // La leave, scoate-l din ambele
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
          setCameraOffUsers((prev) => {
            const next = new Set(prev);
            next.delete(user.uid);
            return next;
          });
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
      if (screenTrackRef.current) screenTrackRef.current.close();
      client.removeAllListeners();
      client.leave();
      screenClient.leave();
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

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenTrackRef.current) {
        screenTrackRef.current.close();
        await screenClient.unpublish(screenTrackRef.current);
      }
      await screenClient.leave();
      setIsScreenSharing(false);
      screenTrackRef.current = null;
      if (onScreenTrackChange) onScreenTrackChange(null);
    } else {
      try {
        const screenResult = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: "1080p_1",
        });
        const screenVideoTrack = Array.isArray(screenResult)
          ? screenResult[0]
          : screenResult;
        screenTrackRef.current = screenVideoTrack;
        const screenUid = Number(config.uid) + 100000;
        await screenClient.join(
          config.appId,
          config.channel,
          config.token,
          screenUid,
        );
        await screenClient.publish(screenResult);
        setIsScreenSharing(true);
        if (onScreenTrackChange) onScreenTrackChange(screenVideoTrack);
        screenVideoTrack.on("track-ended", async () => {
          await screenClient.leave();
          setIsScreenSharing(false);
          screenTrackRef.current = null;
          if (onScreenTrackChange) onScreenTrackChange(null);
        });
      } catch (error) {
        console.error("Failed to share screen", error);
      }
    }
  };

  const Controls = () => (
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
      <button
        className={`control-btn ${isScreenSharing ? "control-btn--off" : ""}`}
        onClick={toggleScreenShare}
        title={isScreenSharing ? "Oprește partajarea" : "Partajează ecranul"}
        disabled={!isScreenSharing && isSomeoneElseSharing}
        style={{ opacity: !isScreenSharing && isSomeoneElseSharing ? 0.5 : 1 }}
      >
        <ScreenShareIcon active={!isScreenSharing} />
      </button>
    </div>
  );

  return (
    <div className="main-container--video">
      {/* TEACHER VIDEO */}
      <div
        className="teacher-video-container video-hover-wrapper"
        onMouseEnter={() => setHoveredUid(teacherUid)}
        onMouseLeave={() => setHoveredUid(null)}
      >
        {isCurrentUserTeacher ? (
          <>
            <div ref={localVideoRef} style={{ width: "100%", height: "100%" }}>
              {!localVideoTrack && <p>Se încarcă camera...</p>}
            </div>
            {!cameraOn && <CameraOffAvatar />}
            <Controls />
          </>
        ) : (
          <>
            <div
              style={{
                width: "100%",
                height: "100%",
                display:
                  teacherRemote && !cameraOffUsers.has(teacherUid)
                    ? "block"
                    : "none",
              }}
              ref={(node) => {
                teacherVideoRef.current = node;
                if (node && teacherVideoTrackRef.current) {
                  teacherVideoTrackRef.current.play(node);
                }
              }}
            />
            {/* Avatar profesor când camera e oprită */}
            {teacherRemote && cameraOffUsers.has(teacherUid) && (
              <CameraOffAvatar />
            )}
            {!teacherRemote && <p>Profesorul nu s-a conectat încă...</p>}
          </>
        )}

        {hoveredUid === teacherUid && (
          <div className="video-name-tag">
            {isCurrentUserTeacher
              ? `${teacherName} (Tu)`
              : teacherName || "Profesor"}
          </div>
        )}
      </div>

      {/* STUDENT VIDEOS */}
      <div className="children-video-container">
        {!isCurrentUserTeacher && (
          <div
            className="child-video video-hover-wrapper"
            onMouseEnter={() => setHoveredUid(config.uid)}
            onMouseLeave={() => setHoveredUid(null)}
          >
            <div ref={localVideoRef} style={{ width: "100%", height: "100%" }}>
              {!localVideoTrack && <p>Se încarcă camera...</p>}
            </div>
            {!cameraOn && <CameraOffAvatar />}
            <Controls />
            {hoveredUid === config.uid && (
              <div className="video-name-tag">
                {getParticipantName(config.uid)} (Tu)
              </div>
            )}
          </div>
        )}

        {studentRemotes.map((user: IAgoraRTCRemoteUser) => (
          <div
            key={user.uid}
            className="child-video video-hover-wrapper"
            onMouseEnter={() => setHoveredUid(user.uid)}
            onMouseLeave={() => setHoveredUid(null)}
          >
            {/* Video track — ascuns când camera e oprită */}
            <div
              style={{
                width: "100%",
                height: "100%",
                display: cameraOffUsers.has(user.uid) ? "none" : "block",
              }}
              ref={(node) => {
                remoteVideoRefs.current[user.uid] = node;
                if (node && videoTracksRef.current[user.uid]) {
                  videoTracksRef.current[user.uid].play(node);
                }
              }}
            />
            {/* Avatar când camera e oprită */}
            {cameraOffUsers.has(user.uid) && <CameraOffAvatar />}

            {hoveredUid === user.uid && (
              <div className="video-name-tag">
                {getParticipantName(user.uid)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
