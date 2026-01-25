import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex h-screen">

      {/* === SIDEBAR === */}
      <div className={`${chatOpen ? "hidden md:flex" : "flex"} z-50`}>
        <Sidebar />
      </div>

      {/* === CONTENU === */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800">
        <Outlet context={{ setChatOpen }} />
      </div>

    </div>
  );
}
