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
  const videoTracksRef = useRef<{ [uid: string]: any }>({});

  const teacherUid = config?.teacherUid;
  const isCurrentUserTeacher = config?.uid === teacherUid;
  const teacherRemote = remoteUsers.find((u) => u.uid === teacherUid);
  const studentRemotes = remoteUsers.filter((u) => u.uid !== teacherUid);

  // Play local video once track and ref are ready
  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      localVideoTrack.play(localVideoRef.current);
    }
  }, [localVideoTrack]);

  // Close channel on backend when everyone leaves
  useEffect(() => {
    if (remoteUsers.length === 0 && localVideoTrack && lessonId) {
      api.post(`/api/lessons/${lessonId}/close-channel/`).catch((err) => {
        console.error("Could not close channel:", err);
      });
    }
  }, [remoteUsers]);

  // Main setup and teardown
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
            // Save track in ref immediately after subscribe
            videoTracksRef.current[user.uid] = user.videoTrack;
            console.log("=== user-published video ===");
            console.log("user.uid:", user.uid, typeof user.uid);
            console.log("teacherUid:", teacherUid, typeof teacherUid);
            console.log("user.videoTrack:", user.videoTrack);

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
      client.removeAllListeners();
      client.leave();
    };
  }, [config]);

  return (
    <div className="main-container--video">
      {/* TEACHER VIDEO (top) */}
      <div className="teacher-video-container">
        {isCurrentUserTeacher ? (
          <div ref={localVideoRef} style={{ width: "100%", height: "100%" }}>
            {!localVideoTrack && <p>Se încarcă camera...</p>}
          </div>
        ) : (
          <>
            {/* Always in DOM — never unmounts */}
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
      </div>

      {/* STUDENT VIDEOS (bottom) */}
      <div className="children-video-container">
        {!isCurrentUserTeacher && (
          <div ref={localVideoRef} className="child-video">
            {!localVideoTrack && <p>Se încarcă camera...</p>}
          </div>
        )}

        {studentRemotes.map((user: IAgoraRTCRemoteUser) => (
          <div
            key={user.uid} // ← make sure this is stable
            className="child-video"
            ref={(node) => {
              remoteVideoRefs.current[user.uid] = node;
              if (node && videoTracksRef.current[user.uid]) {
                videoTracksRef.current[user.uid].play(node);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
