import { VideoControls } from "./VideoControls";

import { useEffect, useRef } from "react";
import {
  type ICameraVideoTrack,
  type IRemoteVideoTrack,
} from "agora-rtc-sdk-ng";

interface ParticipantVideoProps {
  name: string;
  videoTrack?: ICameraVideoTrack | IRemoteVideoTrack | null;
}

export const ParticipantVideo = ({
  name,
  videoTrack,
}: ParticipantVideoProps) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoTrack && videoContainerRef.current) {
      videoTrack.play(videoContainerRef.current);
    }

    return () => {
      videoTrack?.stop();
    };
  }, [videoTrack]);

  return (
    <div className="relative bg-gray-800 overflow-hidden">
      <span className="absolute top-2 left-2 z-10 text-xs text-white bg-black/40 px-2 py-0.5 rounded">
        {name}
      </span>

      <div ref={videoContainerRef} className="w-full h-52 bg-gray-700" />

      {!videoTrack && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
          No video
        </div>
      )}

      <VideoControls
        onMute={() => {}}
        onEndCall={() => {}}
        onSwitchCamera={() => {}}
      />
    </div>
  );
};
