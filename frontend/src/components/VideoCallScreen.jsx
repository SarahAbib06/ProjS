
import React from "react";
import { Phone, Mic, Video, Volume2, Users } from "lucide-react";

export default function VideoCallScreen({ selectedChat, onClose }) {

  const safeChat = {
    name: selectedChat?.name || "Utilisateur",
    avatar: selectedChat?.avatar || "https://i.pravatar.cc/150?img=5",
  };

  const [isMinimized, setIsMinimized] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">

      <div
        className={`
          relative shadow-xl overflow-hidden bg-[#d9b899] 
          transition-all duration-300 ease-in-out

          ${isFullscreen 
            ? "fixed inset-0 w-screen h-screen rounded-none z-[9999]" 
            : "w-[92%] md:w-[72%] h-[87%] rounded-xl"
          }

          ${isMinimized 
            ? "fixed bottom-6 right-6 w-48 h-32 rounded-xl z-[9999]" 
            : ""
          }
        `}
      >

        {/* RESTORE BUTTON when minimized */}
        {isMinimized && (
          <button
            onClick={() => setIsMinimized(false)}
            className="absolute top-1 left-1 bg-black/60 text-white px-2 py-1 rounded-md text-xs z-[10000]"
          >
            ↖
          </button>
        )}

        {/* TOP RIGHT ICONS */}
        {!isMinimized && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-3
            bg-black/40 backdrop-blur-sm px-3 py-2 rounded-xl"
          >

            {/* MINIMIZE */}
            <button
              onClick={() => {
                setIsMinimized(true);
                setIsFullscreen(false);
              }}
            >
              <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                <rect x="4" y="11" width="16" height="2" />
              </svg>
            </button>

            {/* FULLSCREEN */}
            <button
              onClick={() => {
                setIsFullscreen(!isFullscreen);
                setIsMinimized(false);
              }}
            >
              <svg width="22" height="22" fill="white" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm0-4h2V7h3V5H7v5zm10 9h-3v2h5v-5h-2v3zm0-9V5h-5v2h3v3h2z"/>
              </svg>
            </button>

          </div>
        )}

        {/* VIDEO */}
        <img
          src={safeChat.avatar}
          className="w-full h-full object-cover"
        />

        {/* MINI VIDEO */}
        {!isMinimized && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2 
            w-32 h-36 bg-white rounded-xl shadow-md overflow-hidden"
          >
            <img
              src="https://i.pravatar.cc/150?img=12"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* NAME + TIMER */}
        {!isMinimized && (
          <div className="
            absolute left-1/2 -translate-x-1/2 top-90
            px-4 py-1.5 bg-black/30 text-black bg-white/22 backdrop-blur-md 
            rounded-xl border border-myYellow flex items-center gap-8 md:gap-11 text-sm
          ">
            <div className="flex items-center gap-2">
              <img
                src={safeChat.avatar}
                className="w-6 h-6 rounded-full"
              />
              <span className="font-medium">{safeChat.name}</span>
            </div>

            <div className="flex items-center gap-1 text-red-400 font-semibold">
              <span className="text-[10px]">●</span>
              <span>07:23</span>
            </div>
          </div>
        )}

        {/* BOTTOM CONTROLS */}
        {!isMinimized && (
          <div className="
            absolute bottom-9 left-1/2 -translate-x-1/2 
            w-[90%] sm:w-[85%] bg-white/25 backdrop-blur-md 
            py-2 rounded-xl shadow-md flex flex-wrap
            items-center justify-between gap-3 px-4 border border-myYellow
          ">

            {/* USERS */}
            <div className="flex items-center gap-2 text-black font-semibold w-auto">
              <svg width="20" height="20" fill="black" viewBox="0 0 24 24">
                <path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-8 0a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-2.67 0-8 1.34-8 4v2h8v-2c0-.69.1-1.35.29-2-.88-.63-1.46-1.64-1.46-2zm8 0c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span>2</span>
            </div>

            {/* ICONS CENTER (RESPONSIVE) */}
            <div className="flex-1 flex items-center justify-center gap-2 sm:gap-4 flex-wrap">

              {/* Micro */}
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow">
                <svg width="20" height="20" fill="black" viewBox="0 0 24 24">
                  <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/>
                  <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.08A7 7 0 0 0 19 11z"/>
                </svg>
              </div>

              {/* Camera */}
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow">
                <svg width="22" height="22" fill="black" viewBox="0 0 24 24">
                  <path d="M17 10.5V7a2 2 0 0 0-2-2H5A2 2 0 0 0 3 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3.5l4 4v-11l-4 4z"/>
                </svg>
              </div>

              {/* Volume */}
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow">
                <svg width="22" height="22" fill="black" viewBox="0 0 24 24">
                  <path d="M11 5 6.5 9H3v6h3.5L11 19V5z"/>
                  <path d="M14.54 8.46a5 5 0 0 1 0 7.07l1.41 1.41a7 7 0 0 0 0-9.9l-1.41 1.42z"/>
                </svg>
              </div>

              {/* Share */}
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow">
                <svg width="25" height="25" fill="black" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="12" rx="2"/>
                  <path d="M12 7l3 3h-2v5h-2v-5H9l3-3z" fill="white"/>
                </svg>
              </div>

              {/* HANGUP */}
              <button
                onClick={onClose}
                className="px-5 h-10 bg-red-600 rounded-full flex items-center justify-center shadow"
              >
                <svg width="22" height="22" fill="white" viewBox="0 0 24 24">
                  <path d="M21.71 16.29l-3-3a1 1 0 0 0-1.41 0l-1.72 1.72a15 15 0 0 1-7.16-7.16L9.14 6.13a1 1 0 0 0 0-1.41l-3-3a1 1 0 0 0-1.41 0L2.29 4.16a3 3 0 0 0-.78 2.89 19 19 0 0 0 16.42 16.42 3 3 0 0 0 2.89-.78l2.44-2.44a1 1 0 0 0 0-1.41z"/>
                </svg>
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
