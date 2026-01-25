// src/components/ParametresMenu.jsx
import { MdComputer, MdLock, MdNotifications, MdHelp, MdLogout } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { profileService } from "../services/profileService";
import { useState, useEffect } from "react";
 
export default function ParametresMenu({ selected, setSelected }) {
  const { t } = useTranslation();
    const [profilePicture, setProfilePicture] = useState("");
 const [name, setName] = useState("");
   const [preview] = useState(null);
 useEffect(() => {
    const loadProfile = async () => {
  try {
    const user = await profileService.getProfile();
    setName(user.username);
     setProfilePicture(user.profilePicture); 
    
  } catch (err) {
    console.error("Erreur chargement profil :", err);
  }
};


    loadProfile();
  }, []);

const handleLogout = () => {
    // 1) supprimer le token (nommé "token" ici — change si tu as un autre nom)
    localStorage.removeItem("token");

    // 2) si tu as un refresh token
    localStorage.removeItem("refreshToken");

    // 3) supprimer les infos user si stockées
    localStorage.removeItem("user");

    // 4) rediriger vers la page login
    // Option simple :
    window.location.href = "/login";
    // Si tu utilises react-router, on préférera navigate("/login") (voir Option B)
  };







  return (
    <div
      className="
        w-full md:w-[320px] 
        bg-myGray4 dark:bg-mydarkGray3
        rounded-xl 
        shadow-md 
        border border-myGray4 dark:border-gray-700
        p-6
        flex flex-col
        gap-6
        h-[500px]
      "
    >
      {/* TITRE PARAMETRES */}
      <div className="text-xl font-semibold text-myBlack dark:text-white">
        {t("parametresMenu.Title")}
      </div>

      {/* PHOTO + NOM */}
      <div className="flex items-center gap-3 -mt-2">
        <img
          src={preview || profilePicture || ""}
          alt="profile"
          className="w-14 h-14 rounded-full object-cover border-2 border-myBlack"
        />
        <button
          onClick={() => setSelected("profil")}
          className="font-medium text-myBlack dark:text-white hover:underline cursor-pointer"
        >
         {name}
        </button>
      </div>

      {/* MENU */}
      <div className="border-t border-gray-300 dark:border-gray-700 pt-4 flex flex-col gap-2">

        {/* GENERAL */}
        <button
          onClick={() => setSelected("general")}
          className={`flex items-center gap-3 p-3 rounded-md transition 
            ${selected === "general" ? "bg-[#F9EE34]" : "hover:bg-gray-300 dark:hover:bg-gray-700"}
          `}
        >
          <MdComputer className={`w-5 h-5 ${selected === "general" ? "text-[var(--color-myBlack)]" : "text-gray-500 dark:text-gray-300"}`} />
          <span className={`text-sm font-medium ${selected === "general" ? "text-[var(--color-myBlack)]" : "text-gray-1000 dark:text-gray-300"}`}>
            {t("parametresMenu.General")}
          </span>
        </button>

        {/* CONFIDENTIALITÉ */}
        <button
          onClick={() => setSelected("privacy")}
          className={`flex items-center gap-3 p-3 rounded-md transition 
            ${selected === "privacy" ? "bg-[#F9EE34]" : "hover:bg-gray-300 dark:hover:bg-gray-700"}
          `}
        >
          <MdLock className={`w-5 h-5 ${selected === "privacy" ? "text-[var(--color-myBlack)]" : "text-gray-500 dark:text-gray-300"}`} />
          <span className={`text-sm font-medium ${selected === "privacy" ? "text-[var(--color-myBlack)]" : "text-gray-1000 dark:text-gray-300"}`}>
            {t("parametresMenu.Confidentialite")}
          </span>
        </button>

        {/* NOTIFICATIONS */}
        <button
          onClick={() => setSelected("notif")}
          className={`flex items-center gap-3 p-3 rounded-md transition 
            ${selected === "notif" ? "bg-[#F9EE34]" : "hover:bg-gray-300 dark:hover:bg-gray-700"}
          `}
        >
          <MdNotifications className={`w-5 h-5 ${selected === "notif" ? "text-[var(--color-myBlack)]" : "text-gray-500 dark:text-gray-300"}`} />
          <span className={`text-sm font-medium ${selected === "notif" ? "text-[var(--color-myBlack)]" : "text-gray-1000 dark:text-gray-300"}`}>
            {t("parametresMenu.Notifications")}
          </span>
        </button>

        {/* AIDE & SUPPORT */}
        <button
          onClick={() => setSelected("help")}
          className={`flex items-center gap-3 p-3 rounded-md transition 
            ${selected === "help" ? "bg-[#F9EE34]" : "hover:bg-gray-300 dark:hover:bg-gray-700"}
          `}
        >
          <MdHelp className={`w-5 h-5 ${selected === "help" ? "text-[var(--color-myBlack)]" : "text-gray-500 dark:text-gray-300"}`} />
          <span className={`text-sm font-medium ${selected === "help" ? "text-[var(--color-myBlack)]" : "text-gray-1000 dark:text-gray-300"}`}>
            {t("parametresMenu.Aide")}
          </span>
        </button>

        {/* --- TRAIT SEPARATEUR AVANT DECONNEXION --- */}
        <div className="border-t border-gray-300 dark:border-gray-700 pt-2"></div>

        {/* DÉCONNEXION */}

        <button
  onClick={handleLogout}
  className="flex items-center gap-3 p-3 rounded-md hover:bg-red-300 dark:hover:bg-red-700 transition"
>
  <MdLogout className="w-5 h-5 text-red-600" />
  <span className="text-sm font-medium text-red-600">
    {t("parametresMenu.Deconnexion")}
  </span>
</button>


      </div>
    </div>
  );
}