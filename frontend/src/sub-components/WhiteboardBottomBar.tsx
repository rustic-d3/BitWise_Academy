import { PenIcon, SaveIcon, UploadIcon } from "../includes/Icons";

export const WhiteboardBottomBar = () => (
  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
    <button className="w-10 h-10 rounded-full bg-[#BE3455] hover:bg-[#a82d4a] text-white flex items-center justify-center shadow-md transition-colors">
      <PenIcon />
    </button>
    <div className="flex gap-2">
      <button className="w-10 h-10 rounded-full bg-[#BE3455] hover:bg-[#a82d4a] text-white flex items-center justify-center shadow-md transition-colors">
        <SaveIcon />
      </button>
      <button className="w-10 h-10 rounded-full bg-[#BE3455] hover:bg-[#a82d4a] text-white flex items-center justify-center shadow-md transition-colors">
        <UploadIcon />
      </button>
    </div>
  </div>
);
