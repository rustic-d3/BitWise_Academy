interface LeftPanelProps {
  children?: React.ReactNode;
}

export const LeftPanel = ({ children }: LeftPanelProps) => (
  <div className="w-80 flex flex-col border-r border-gray-200 bg-white shrink-0 overflow-y-auto">
    <div className="flex flex-col gap-2 p-2">{children}</div>

    {!children && (
      <div className="flex-1 flex items-center justify-center text-sm italic text-[#BE3455]">
        Waiting for students...
      </div>
    )}
  </div>
);
