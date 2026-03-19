import { VideoControls } from "./VideoControls";

interface ParticipantVideoProps {
  name: string;
  videoSrc?: string;
}

export const ParticipantVideo = ({ name, videoSrc }: ParticipantVideoProps) => (
  <div className="relative bg-gray-800 overflow-hidden">
    <span className="absolute top-2 left-2 z-10 text-xs text-white bg-black/40 px-2 py-0.5 rounded">
      {name}
    </span>
    {videoSrc ? (
      <video src={videoSrc} autoPlay muted className="w-full block" />
    ) : (
      <div className="w-full h-52 bg-gray-700 flex items-center justify-center text-gray-400 text-sm">
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
