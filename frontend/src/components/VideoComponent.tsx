import React, { useEffect, useState, useRef } from "react";
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
}

export default function VideoComponent({ config, lessonId }: Props) {
  const [localVideoTrack, setLocalVideoTrack] =
    useState<ICameraVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);

  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const teacherVideoRef = useRef<HTMLDivElement | null>(null);
  const teacherVideoTrackRef = useRef<any>(null);
  const remoteVideoRefs = useRef<{ [uid: string]: HTMLDivElement | null }>({});

  const teacherUid = config?.teacherUid;
  const isCurrentUserTeacher = config?.uid === teacherUid;
  const teacherRemote = remoteUsers.find((u) => u.uid === teacherUid);
  const studentRemotes = remoteUsers.filter((u) => u.uid !== teacherUid);

  // Redă video-ul profesorului remote după ce DOM-ul e actualizat
  useEffect(() => {
    if (teacherVideoRef.current && teacherVideoTrackRef.current) {
      teacherVideoTrackRef.current.play(teacherVideoRef.current);
    }
  }, [teacherRemote]);

  // Redă video-urile studenților remote după ce DOM-ul e actualizat
  useEffect(() => {
    studentRemotes.forEach((user) => {
      const ref = remoteVideoRefs.current[user.uid];
      if (ref && user.videoTrack) {
        user.videoTrack.play(ref);
      }
    });
  }, [remoteUsers]);

  // Când toți userii au plecat, închide canalul pe backend
  useEffect(() => {
    if (remoteUsers.length === 0 && localVideoTrack && lessonId) {
      api.post(`/api/lessons/${lessonId}/close-channel/`).catch((err) => {
        console.error("Nu s-a putut închide canalul:", err);
      });
    }
  }, [remoteUsers]);

  // Redă local video după ce track-ul și ref-ul sunt disponibile
  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      localVideoTrack.play(localVideoRef.current);
    }
  }, [localVideoTrack]);

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
        setLocalVideoTrack(videoTrack);
        await client.publish([audioTrack, videoTrack]);
      } catch (err) {
        console.error("Eroare la setup:", err);
      }
    };

    if (config) setupCall();

    return () => {
      isActive = false;
      localVideoTrackRef.current?.close();
      client.removeAllListeners();
      client.leave();
    };
  }, [config]);

  return (
    <div className="main-container--video">
      {/* TEACHER VIDEO (sus) */}
      <div className="teacher-video-container">
        {isCurrentUserTeacher ? (
          <div ref={localVideoRef} style={{ width: "100%", height: "100%" }}>
            {!localVideoTrack && <p>Se încarcă camera...</p>}
          </div>
        ) : teacherRemote ? (
          <div
            ref={(node) => {
              teacherVideoRef.current = node;
              if (node && teacherVideoTrackRef.current) {
                teacherVideoTrackRef.current.play(node);
              }
            }}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <p>Profesorul nu s-a conectat încă...</p>
        )}
      </div>

      {/* STUDENT VIDEOS (jos) */}
      <div className="children-video-container">
        {!isCurrentUserTeacher && (
          <div ref={localVideoRef} className="child-video">
            {!localVideoTrack && <p>Se încarcă camera...</p>}
          </div>
        )}

        {studentRemotes.map((user: IAgoraRTCRemoteUser) => (
          <div
            key={user.uid}
            className="child-video"
            ref={(node) => {
              remoteVideoRefs.current[user.uid] = node;
              if (node && user.videoTrack) {
                user.videoTrack.play(node);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
