import { ChatIcon, VideoIcon } from "../includes/Icons";

// TopBar.tsx
interface TopBarProps {
  onLeave: () => Promise<void>;
}

export const TopBar = ({ onLeave }: TopBarProps) => (
  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
    <div className="flex items-center gap-2">
      <button className="p-2 text-gray-500 hover:text-[#BE3455] rounded-md transition-colors">
        <VideoIcon />
      </button>
      <button className="p-2 text-gray-500 hover:text-[#BE3455] rounded-md transition-colors">
        <ChatIcon />
      </button>
    </div>

    {/* Join / Leave button */}

    <button
      onClick={onLeave}
      className="px-4 py-1.5 text-sm rounded-md bg-[#BE3455] hover:bg-[#a82d4a] text-white transition-colors"
    >
      Leave
    </button>
  </div>
);
