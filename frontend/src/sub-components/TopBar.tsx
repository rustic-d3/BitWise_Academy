import { ChatIcon, VideoIcon } from "../includes/Icons";

export const TopBar = () => (
  <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-white">
    <button className="p-2 text-gray-500 hover:text-[#BE3455] rounded-md transition-colors">
      <VideoIcon />
    </button>
    <button className="p-2 text-gray-500 hover:text-[#BE3455] rounded-md transition-colors">
      <ChatIcon />
    </button>
  </div>
);
