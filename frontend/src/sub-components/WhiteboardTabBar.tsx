import type { JSX } from "react";
import { CloseIcon, PlusIcon, RefreshIcon, ShareIcon } from "../includes/Icons";

export interface Tab {
  id: string;
  label: string;
}

interface WhiteboardTabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onAddTab: () => void;
}

export const WhiteboardTabBar = ({
  tabs,
  activeTab,
  onTabChange,
  onAddTab,
}: WhiteboardTabBarProps): JSX.Element => (
  <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50">
    <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors">
      <RefreshIcon />
    </button>
    {tabs.map((tab) => (
      <div
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer text-sm transition-colors select-none
          ${
            activeTab === tab.id
              ? "bg-white border border-gray-200 text-gray-800 shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
      >
        {tab.label}
        {activeTab === tab.id && (
          <>
            <button className="p-0.5 text-gray-400 hover:text-[#BE3455] transition-colors rounded">
              <ShareIcon />
            </button>
            <button className="p-0.5 text-gray-400 hover:text-[#BE3455] transition-colors rounded">
              <CloseIcon />
            </button>
          </>
        )}
      </div>
    ))}
    <button
      onClick={onAddTab}
      className="p-1.5 text-gray-400 hover:text-[#BE3455] rounded transition-colors"
    >
      <PlusIcon />
    </button>
  </div>
);
