import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  type IAgoraRTCRemoteUser,
  type ICameraVideoTrack,
} from "agora-rtc-sdk-ng";
import { TopBar } from "../sub-components/TopBar";
import { LeftPanel } from "../sub-components/LeftPanel";
import { WhiteboardCanvas } from "../sub-components/WhiteboardCanvas";
import { WhiteboardSidebar } from "../sub-components/WhiteboardSidebar";
import { WhiteboardBottomBar } from "../sub-components/WhiteboardBottomBar";
import { WhiteboardTabBar, type Tab } from "../sub-components/WhiteboardTabBar";
import { ParticipantVideo } from "../sub-components/ParticipantVideo";
import {
  joinChannel,
  leaveChannel,
  setRemoteUsersCallback,
} from "../includes/agora_config";

export default function TutoringLayout() {
  const navigate = useNavigate();

  // --- Whiteboard state ---
  const [tabs, setTabs] = useState<Tab[]>([{ id: "wb1", label: "Whiteboard" }]);
  const [activeTab, setActiveTab] = useState("wb1");

  // --- Agora state ---
  const [localVideoTrack, setLocalVideoTrack] =
    useState<ICameraVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);

  // Join on mount, leave on unmount
  useEffect(() => {
    const join = async () => {
      setRemoteUsersCallback(setRemoteUsers);
      const track = await joinChannel();
      setLocalVideoTrack(track);
    };

    join();

    return () => {
      leaveChannel();
    };
  }, []);

  // --- Handlers ---
  const handleLeave = async () => {
    await leaveChannel();
    navigate("/dashboard");
  };

  const handleAddTab = () => {
    const id = `wb${tabs.length + 1}`;
    setTabs([...tabs, { id, label: `Whiteboard ${tabs.length + 1}` }]);
    setActiveTab(id);
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-100">
      {/* Top navigation bar */}
      <TopBar onLeave={handleLeave} />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: video + participants */}
        <LeftPanel>
          {/* Local user video */}
          <ParticipantVideo name="You" videoTrack={localVideoTrack} />

          {/* Remote users */}
          {remoteUsers.map((user) => (
            <ParticipantVideo
              key={user.uid}
              name={`User ${user.uid}`}
              videoTrack={user.videoTrack ?? null}
            />
          ))}
        </LeftPanel>

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
