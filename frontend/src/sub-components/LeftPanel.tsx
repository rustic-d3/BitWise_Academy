import { ParticipantList } from "./ParticipantList";
import { ParticipantVideo } from "./ParticipantVideo";

export const LeftPanel = () => (
  <div className="w-80 flex flex-col border-r border-gray-200 bg-white shrink-0">
    <ParticipantVideo name="Rustic Dumbrava" />

    {/* Student list / waiting area */}
    <ParticipantList />

    {/* Bottom chat input area */}
    <div className="border-t border-gray-200 p-2">
      {/* Chat input can go here */}
    </div>
  </div>
);
