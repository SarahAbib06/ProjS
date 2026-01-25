import React from "react";
import { useTranslation } from "react-i18next";
import logo from "../assets/images/owlylogo.png";
import DarkModeToggle from "../components/DarkModeToggle";

const LockIcon = ({ isDark }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={isDark ? "#cfcfcf" : "#6b6b6b"}
  >
    <path d="M17 8h-1V6A4 4 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2ZM9 6a3 3 0 0 1 6 0v2H9ZM17 20H6V10h11v10Z"/>
  </svg>
);

export default function WelcomeChatScreen() {
  const { t } = useTranslation();

  // détecte le mode sombre automatiquement
  const isDark = document.documentElement.classList.contains("dark");

  return (
    <div className="w-full h-full flex flex-col items-center justify-center 
                 text-center px-10 relative
                 transition-colors duration-300 
                 bg-white dark:bg-[#121212]">


     <div className="w-15 h-15 rounded-2xl bg-myYellow flex items-center justify-center shadow mb-6">
        <img 
          src={logo} 
          alt="Logo"
          className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] md:w-[400px] md:h-[400px] object-contain"
        />
      </div>

      <h2 className="text-xl font-bold mb-2 text-black dark:text-white transition-colors">
        {t("welcome.title")}
      </h2>

      <p className="text-[11px] 
                    text-[var(--color-myGray2)] 
                    dark:text-gray-300 
                    max-w-[500px] transition-colors">
        {t("welcome.description")}
      </p>

      <div className="flex items-center gap-2 mt-5 text-[12px] 
                      text-[var(--color-myGray2)] 
                      dark:text-gray-300 transition-colors">
        <LockIcon isDark={isDark} />
        <span>{t("welcome.encrypted")}</span>
      </div>
    </div>
  );
}