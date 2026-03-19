import { useState } from "react";
import { TopBar } from "../sub-components/TopBar";
import { LeftPanel } from "../sub-components/LeftPanel";
import { WhiteboardCanvas } from "../sub-components/WhiteboardCanvas";
import { WhiteboardSidebar } from "../sub-components/WhiteboardSidebar";
import { WhiteboardBottomBar } from "../sub-components/WhiteboardBottomBar";
import { WhiteboardTabBar, type Tab } from "../sub-components/WhiteboardTabBar";

export default function TutoringLayout() {
  const [tabs, setTabs] = useState<Tab[]>([{ id: "wb1", label: "Whiteboard" }]);
  const [activeTab, setActiveTab] = useState("wb1");

  const handleAddTab = () => {
    const id = `wb${tabs.length + 1}`;
    setTabs([...tabs, { id, label: `Whiteboard ${tabs.length + 1}` }]);
    setActiveTab(id);
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-100">
      {/* Top navigation bar */}
      <TopBar />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: video + participants */}
        <LeftPanel />

        {/* Right panel: whiteboard */}
        <div className="flex flex-col flex-1 overflow-hidden bg-white">
          {/* Whiteboard tab bar */}
          <WhiteboardTabBar
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onAddTab={handleAddTab}
          />

          {/* Whiteboard area */}
          <div className="flex flex-1 overflow-hidden">
            <WhiteboardCanvas />
            <WhiteboardSidebar />
          </div>

          {/* Whiteboard bottom toolbar */}
          <WhiteboardBottomBar />
        </div>
      </div>
    </div>
  );
}
