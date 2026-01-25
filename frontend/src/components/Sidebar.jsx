// src/components/Sidebar.jsx
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaFeatherAlt, FaBars } from "react-icons/fa";
import { IoSparklesOutline } from "react-icons/io5";
import { MdMessage, MdGroups, MdSettings } from "react-icons/md";

import { GiGamepad } from "react-icons/gi";

import { useTranslation } from "react-i18next";

export default function Sidebar() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* --- VERTICAL SIDEBAR pour grand écran --- */}
      <div className="hidden sm:flex w-22 h-screen flex-col justify-between items-center py-6 shadow-md border-r-[1.5px] border-gray-300 z-[9999] bg-[#f0f0f0] dark:border-gray-600 dark:bg-[#2E2F2F] transition-colors duration-300">

        {/* TOP ICONS */}
        <div className="flex flex-col items-center gap-5">
          {/* OWLY LOGO */}
          <NavLink to="/welcome">
            {({ isActive }) => (
              <div className="flex flex-col items-center gap-0.5 group">
                <div className={`p-3 rounded-md transition ${isActive ? "bg-black dark:bg-[#F9EE34]" : "hover:bg-gray-300 dark:hover:bg-gray-700"}`}>
                  <FaFeatherAlt className={`w-6 h-6 transition ${isActive ? "text-white dark:text-black" : "text-myBlack dark:text-white"}`} />
                </div>
              </div>
            )}
          </NavLink>

          {/* MESSAGES */}
          <NavLink to="/MessagesPage">
            {({ isActive }) => (
              <div className="flex flex-col items-center gap-0.5 group">
                <div className={`p-3 rounded-md transition ${isActive ? "bg-black dark:bg-[#F9EE34]" : "hover:bg-gray-300 dark:hover:bg-gray-700"}`}>
                  <MdMessage className={`w-6 h-6 transition ${isActive ? "text-white dark:text-black" : "text-myBlack dark:text-white"}`} />
                </div>
                <span className={`text-xs font-medium -mt-3 transform transition-transform duration-150 ${isActive ? "translate-y-4" : "translate-y-0 group-hover:translate-y-4"} text-myBlack dark:text-white`}>
                  {t("sidebar.Message")}
                </span>
              </div>
            )}
          </NavLink>

          {/* GROUPES */}
          <NavLink to="/groupes">
            {({ isActive }) => (
              <div className="flex flex-col items-center gap-0.5 group">
                <div className={`p-3 rounded-md transition ${isActive ? "bg-black dark:bg-[#F9EE34]" : "hover:bg-gray-300 dark:hover:bg-gray-700"}`}>
                  <MdGroups className={`w-6 h-6 transition ${isActive ? "text-white dark:text-black" : "text-myBlack dark:text-white"}`} />
                </div>
                <span className={`text-xs font-medium -mt-3 transform transition-transform duration-150 ${isActive ? "translate-y-4" : "translate-y-0 group-hover:translate-y-4"} text-myBlack dark:text-white`}>
                  {t("sidebar.Groupe")}
                </span>
              </div>
            )}
          </NavLink>

          {/* Séparateur */}
          <div className="w-10 border-t-[1.5px] border-gray-300 dark:border-gray-600 mt-0 mb-2"></div>

          {/* OWLY AI */}
          <NavLink to="/assistant">
            {({ isActive }) => (
              <div className="flex flex-col items-center gap-0.5 group -mt-6">
                <div className={`p-3 rounded-md transition ${isActive ? "bg-black dark:bg-[#F9EE34]" : "hover:bg-gray-300 dark:hover:bg-gray-700"}`}>
                  <IoSparklesOutline className={`w-6 h-6 transition ${isActive ? "text-white dark:text-black" : "text-myBlack dark:text-white"}`} />


                </div>
                <span className={`text-xs font-medium -mt-3 transform transition-transform duration-150 ${isActive ? "translate-y-4" : "translate-y-0 group-hover:translate-y-4"} text-myBlack dark:text-white`}>
                  {t("sidebar.Owly AI")}
                </span>
              </div>
            )}
          </NavLink>


          {/* JEUX */}
          <NavLink to="/games">
            {({ isActive }) => (
              <div className="flex flex-col items-center gap-0.5 group">
                <div className={`p-3 rounded-md transition ${isActive ? "bg-black dark:bg-[#F9EE34]" : "hover:bg-gray-300 dark:hover:bg-gray-700"}`}>
                  <GiGamepad className={`w-6 h-6 transition ${isActive ? "text-white dark:text-black" : "text-myBlack dark:text-white"}`} />
                </div>
                <span className={`text-xs font-medium -mt-3 transform transition-transform duration-150 ${isActive ? "translate-y-4" : "translate-y-0 group-hover:translate-y-4"} text-myBlack dark:text-white`}>
                  {t("sidebar.Jeux")}
                </span>
              </div>
            )}
          </NavLink>

        </div>

        {/* BOTTOM */}
        <div className="flex flex-col items-center gap-5 mb-2">
          <NavLink to="/settings">
            {({ isActive }) => (
              <div className="flex flex-col items-center gap-0.5 group">
                <div className={`p-3 rounded-md transition ${isActive ? "bg-black dark:bg-[#F9EE34]" : "hover:bg-gray-300 dark:hover:bg-gray-700"}`}>
                  <MdSettings className={`w-6 h-6 transition ${isActive ? "text-white dark:text-black" : "text-myBlack dark:text-white"}`} />
                </div>
                <span className={`text-xs font-medium -mt-3 transform transition-transform duration-150 ${isActive ? "translate-y-4" : "translate-y-0 group-hover:translate-y-4"} text-myBlack dark:text-white`}>
                  {t("sidebar.Paramètres")}
                </span>
              </div>
            )}
          </NavLink>


          {/* PROFIL */}

          <NavLink to="/profile">
            {({ isActive }) => (
              <div className="flex flex-col items-center gap-0.5 group">
                <div className={`rounded-full transition ${isActive ? "bg-[#F9EE34] p-0.5" : ""}`}>
                  <img src="/assets/profile.jpg" alt="profile" className="w-14 h-14 rounded-full object-cover border-2 border-myBlack transition" />
                </div>
                <span className="text-xs font-medium mt-1 text-myBlack dark:text-white">
                  {t("sidebar.Profile")}
                </span>
              </div>
            )}
          </NavLink>
        </div>
      </div>

      {/* --- HORIZONTAL SIDEBAR pour petit et moyen écran --- */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 h-15 w-full flex justify-around items-center shadow-md border-t-[1.5px] border-gray-300 bg-[#f0f0f0] dark:border-gray-600 dark:bg-[#2E2F2F] transition-colors duration-300">

        {/* MESSAGES */}
        <NavLink to="/MessagesPage">
          {({ isActive }) => (
            <div className="flex flex-col items-center gap-1">
              <div className={`p-2 rounded-md transition flex justify-center items-center w-14 h-6
                ${isActive ? "bg-black dark:bg-[#F9EE34]" : ""}`}>
                <MdMessage className={`w-6 h-6 ${isActive ? "text-white dark:text-black" : "text-myBlack dark:text-white"}`} />
              </div>
              <span className="text-xs font-medium text-myBlack dark:text-white">
                {t("sidebar.Message")}
              </span>
            </div>
          )}
        </NavLink>

        {/* GROUPES */}
        <NavLink to="/groupes">
          {({ isActive }) => (
            <div className="flex flex-col items-center gap-1">
              <div className={`p-2 rounded-md transition flex justify-center items-center w-14 h-6
                ${isActive ? "bg-black dark:bg-[#F9EE34]" : ""}`}>
                <MdGroups className={`w-6 h-6 ${isActive ? "text-white dark:text-black" : "text-myBlack dark:text-white"}`} />
              </div>
              <span className="text-xs font-medium text-myBlack dark:text-white">
                {t("sidebar.Groupe")}
              </span>
            </div>
          )}
        </NavLink>

        {/* OWLY AI */}
        <NavLink to="/assistant">
          {({ isActive }) => (
            <div className="flex flex-col items-center gap-1">
              <div className={`p-2 rounded-md transition flex justify-center items-center w-14 h-6
                ${isActive ? "bg-black dark:bg-[#F9EE34]" : ""}`}>
                <IoSparklesOutline className={`w-6 h-6 ${isActive ? "text-white dark:text-black" : "text-myBlack dark:text-white"}`} />



              </div>
              <span className="text-xs font-medium text-myBlack dark:text-white">
                {t("sidebar.Owly AI")}
              </span>
            </div>
          )}
        </NavLink>


        {/* JEUX */}
        <NavLink to="/games">
          {({ isActive }) => (
            <div className="flex flex-col items-center gap-1">
              <div className={`p-2 rounded-md transition flex justify-center items-center w-14 h-6
                ${isActive ? "bg-black dark:bg-[#F9EE34]" : ""}`}>
                <GiGamepad className={`w-6 h-6 ${isActive ? "text-white dark:text-black" : "text-myBlack dark:text-white"}`} />
              </div>
              <span className="text-xs font-medium text-myBlack dark:text-white">
                Jeux
              </span>
            </div>
          )}
        </NavLink>


        {/* MENU BURGER */}
        <div className="flex flex-col items-center gap-1 relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`p-2 rounded-md transition flex justify-center items-center w-14 h-6
              ${menuOpen ? "bg-black dark:bg-[#F9EE34]" : ""}`}
          >
            <FaBars className={`w-6 h-6 ${menuOpen ? "text-white dark:text-black" : "text-myBlack dark:text-white"}`} />
          </button>
          <span className="text-xs font-medium text-myBlack dark:text-white">
            Menu
          </span>
=
          {/* MENU POPUP */}
          {menuOpen && (
            <div className="fixed inset-0 flex justify-center items-center z-50">
              <div className="w-60 p-6 rounded-md flex flex-col gap-4 shadow-lg bg-[#EAEAEA] dark:bg-[#2E2F2F]">

                {/* BOUTON FERMER */}

                <button
                  onClick={() => setMenuOpen(false)}
                  className="self-end mb-2 text-xl font-bold text-myBlack dark:text-white hover:opacity-70 transition"
                >
                  &times;
                </button>
                <div className="flex items-center gap-3">
                  <img src="/assets/profile.jpg" alt="profile" className="w-12 h-12 rounded-full object-cover border-2 border-myBlack" />
                  <span className="text-sm font-medium text-myBlack dark:text-white">Rayane ARAB</span>
                </div>

                <NavLink to="/settings" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
                  <MdSettings className="w-6 h-6 text-myBlack dark:text-white" />
                  <span className="text-sm font-medium text-myBlack dark:text-white">{t("sidebar.Paramètres")}</span>
                </NavLink>

                <NavLink to="/games" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
                  <GiGamepad className="w-6 h-6 text-myBlack dark:text-white" />
                  <span className="text-sm font-medium text-myBlack dark:text-white">{t("sidebar.Jeux")}</span>
                </NavLink>


              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
