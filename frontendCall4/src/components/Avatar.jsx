// Avatar.jsx
import React from "react";

export default function Avatar({ name = "", size = 42 }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-gray-200 text-gray-700 font-semibold"
    >
      {initials}
    </div>
  );
}

