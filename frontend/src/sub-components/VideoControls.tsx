import type { JSX } from "react";
import { CloseIcon, MicIcon, RefreshIcon } from "../includes/Icons";

interface VideoControlsProps {
  onMute: () => void;
  onEndCall: () => void;
  onSwitchCamera: () => void;
}

export const VideoControls = ({
  onMute,
  onEndCall,
  onSwitchCamera,
}: VideoControlsProps): JSX.Element => (
  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
    <button
      onClick={onMute}
      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white flex items-center justify-center transition-colors"
    >
      <MicIcon />
    </button>
    <button
      onClick={onEndCall}
      className="w-8 h-8 rounded-full bg-[#BE3455] hover:bg-[#a82d4a] text-white flex items-center justify-center transition-colors"
    >
      <CloseIcon />
    </button>
    <button
      onClick={onSwitchCamera}
      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white flex items-center justify-center transition-colors"
    >
      <RefreshIcon />
    </button>
  </div>
);
