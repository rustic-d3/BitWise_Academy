import { GridIcon, SettingsIcon, UndoIcon } from "../includes/Icons";

export const WhiteboardSidebar = () => (
  <div className="flex flex-col gap-4 px-2 py-3 border-l border-gray-200 bg-gray-50">
    <button className="p-1.5 text-gray-400 hover:text-[#BE3455] rounded transition-colors">
      <SettingsIcon />
    </button>
    <button className="p-1.5 text-gray-400 hover:text-[#BE3455] rounded transition-colors">
      <GridIcon />
    </button>
    <button className="p-1.5 text-gray-400 hover:text-[#BE3455] rounded transition-colors">
      <SettingsIcon />
    </button>
    <button className="p-1.5 text-gray-400 hover:text-[#BE3455] rounded transition-colors">
      <UndoIcon />
    </button>
  </div>
);
