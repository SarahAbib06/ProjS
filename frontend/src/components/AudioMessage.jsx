import React, { useState } from "react";

const formatAudioDuration = (seconds) => {
  if (!seconds || Number.isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function AudioMessage({ src }) {
  const [duration, setDuration] = useState(0);

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <audio
        src={src}
        controls
        className="flex-1"
        onLoadedMetadata={(e) => {
          setDuration(e.target.duration); // durée totale en secondes
        }}
      />
      <span className="text-xs opacity-70">
        {formatAudioDuration(duration)}
      </span>
    </div>
  );
}
