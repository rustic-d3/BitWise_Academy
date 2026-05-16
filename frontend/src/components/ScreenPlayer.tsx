import { useEffect, useRef } from "react";

interface Props {
  track: any; // Aici va veni track-ul video de la Agora (cel de screen share)
}

export default function ScreenPlayer({ track }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (track && containerRef.current) {
      track.play(containerRef.current, { fit: "contain" });
    }

    return () => {
      if (track) {
        track.stop();
      }
    };
  }, [track]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", backgroundColor: "black" }}
      className="screen-share-container"
    />
  );
}
