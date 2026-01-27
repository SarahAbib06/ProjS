// src/components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { MessageCircle, Users, Sparkles, Gamepad2, Settings, Menu } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { profileService } from "../services/profileService";

export default function Sidebar() {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // CHARGER LE PROFIL EXACTEMENT COMME DANS PROFILE.JSX
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await profileService.getProfile();
        setUserProfile(profile);
      } catch (err) {
        console.error("Erreur chargement profil dans Sidebar:", err);
        if (authUser) {
          setUserProfile(authUser);
        }
      }
    };

    loadProfile();
  }, [authUser]);

  // Utiliser le profil chargé ou les données d'authentification
  const user = userProfile || authUser;

  const iconHoverVariants = {
    hover: { 
      scale: 1.05,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  // Fonction pour obtenir la photo de profil
  const getProfilePictureUrl = () => {
    if (!user) {
      return "https://ui-avatars.com/api/?name=User&background=F9EE34&color=000&bold=true&size=128";
    }

    if (!user.profilePicture) {
      const name = user.username || "User";
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F9EE34&color=000&bold=true&size=128`;
    }

    return user.profilePicture;
  };

  // Fonction pour rediriger vers les paramètres avec section profil
  const goToProfile = () => {
    window.location.href = "/settings?section=profil";
  };

  return (
    <>
      {/* ========== VERTICAL SIDEBAR (Desktop) ========== */}
      <div className="hidden sm:flex w-22 h-screen flex-col justify-between items-center pb-6 pt-2 shadow-md border-r-[1.5px] border-gray-300 z-[9999] bg-[#f0f0f0] dark:border-gray-600 dark:bg-[#2E2F2F] transition-colors duration-300">
        
        {/* TOP ICONS */}
        <div className="flex flex-col items-center gap-3">
          
          {/* OWLY LOGO */}
          <motion.button 
            onClick={() => window.location.reload()}
            whileHover="hover"
            whileTap="tap"
            variants={iconHoverVariants}
            className="flex flex-col items-center gap-0.5 group focus:outline-none"
          >
            <div className="rounded-md transition-all duration-300 hover:bg-gray-300 dark:hover:bg-gray-700">
              <img 
                src="/logo.png" 
                alt="OWLY Logo" 
                className={`
                  w-15 h-15 object-contain transition duration-300
                  dark:brightness-0 dark:invert
                `}
              />
            </div>
          </motion.button>

          {/* MESSAGES */}
          <NavLink to="/MessagesPage">
            {({ isActive }) => (
              <motion.div 
                whileHover="hover"
                whileTap="tap"
                variants={iconHoverVariants}
                className="flex flex-col items-center group"
              >
                <div className={`p-2 mb-2 rounded-md transition-all duration-300 ${
                  isActive 
                    ? "bg-black mb-3 dark:bg-[#F9EE34] shadow-lg" 
                    : "hover:bg-gray-300 dark:hover:bg-gray-700"
                }`}>
                  <MessageCircle className={`w-5 h-5 transition ${
                    isActive 
                      ? "text-white dark:text-black" 
                      : "text-myBlack dark:text-white"
                  }`} />
                </div>
                <span className="text-[10px] -mt-3 text-myBlack dark:text-white">
                  {t("sidebar.Message")}
                </span>
              </motion.div>
            )}
          </NavLink>

                    {/* JEUX */}
          <NavLink to="/games">
            {({ isActive }) => (
              <motion.div 
                whileHover="hover"
                whileTap="tap"
                variants={iconHoverVariants}
                className="flex flex-col items-center gap-0.5 group"
              >
                <div className={`p-2 mb-2 rounded-md transition-all duration-300 ${
                  isActive 
                    ? "bg-gradient-to-br from-green-600 to-teal-600 mb-3 shadow-lg shadow-green-500/50" 
                    : "hover:bg-green-50 dark:hover:bg-green-900/30"
                }`}>
                  <Gamepad2 className={`w-5 h-5 transition ${
                    isActive 
                      ? "text-white" 
                      : "text-myBlack dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400"
                  }`} />
                </div>
                <span className={`text-[10px] -mt-3 transition-all duration-300 ${
                  isActive 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-myBlack dark:text-white"
                }`}>
                  {t("sidebar.Jeux")}
                </span>
              </motion.div>
            )}
          </NavLink>

          {/* Séparateur */}
          <div className="w-10 border-t-[1.5px] border-gray-300 dark:border-gray-600 mt-0 mb-5" />

          {/* OWLY AI */}
          <NavLink to="/assistant">
            {({ isActive }) => (
              <motion.div 
                whileHover="hover"
                whileTap="tap"
                variants={iconHoverVariants}
                className="flex flex-col items-center gap-0.5 group -mt-6 relative"
              >
                <div className={`p-2 mb-2 rounded-md transition-all duration-300 ${
                  isActive 
                    ? "bg-gradient-to-br from-purple-600 to-indigo-600 mb-3 shadow-lg shadow-purple-500/50" 
                    : "hover:bg-purple-50 dark:hover:bg-purple-900/30"
                }`}>
                  <Sparkles className={`w-5 h-5 transition ${
                    isActive 
                      ? "text-white" 
                      : "text-myBlack dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400"
                  }`} />
                </div>
                <span className={`text-[10px] -mt-3 transition-all duration-300 ${
                  isActive 
                    ? "text-purple-600 dark:text-purple-400" 
                    : "text-myBlack dark:text-white"
                }`}>
                  {t("sidebar.Owly AI")}
                </span>
                {isActive && (
                  <motion.div
                    animate={{ 
                      boxShadow: [
                        "0 0 0px rgba(168, 85, 247, 0)",
                        "0 0 20px rgba(168, 85, 247, 0.4)",
                        "0 0 0px rgba(168, 85, 247, 0)"
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-md"
                  />
                )}
              </motion.div>
            )}
          </NavLink>


        </div>

        {/* BOTTOM */}
        <div className="flex flex-col items-center gap-5 mb-2">
          
          {/* PARAMÈTRES */}
          <NavLink to="/settings">
            {({ isActive }) => (
              <motion.div 
                whileHover="hover"
                whileTap="tap"
                variants={iconHoverVariants}
                className="flex flex-col items-center gap-0.5 group"
              >
                <div className={`p-3 mb-2 rounded-md transition-all duration-300 ${
                  isActive 
                    ? "bg-black dark:bg-[#F9EE34] shadow-lg" 
                    : "hover:bg-gray-300 dark:hover:bg-gray-700"
                }`}>
                  <motion.div
                    animate={isActive ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Settings className={`w-5 h-5 transition ${
                      isActive 
                        ? "text-white dark:text-black" 
                        : "text-myBlack dark:text-white"
                    }`} />
                  </motion.div>
                </div>
                <span className="text-[10px] -mt-3 text-myBlack dark:text-white">
                  {t("sidebar.Paramètres")}
                </span>
              </motion.div>
            )}
          </NavLink>

          {/* PROFIL - PHOTO CLIQUABLE VERS /settings?section=profil */}
          <div className="flex flex-col items-center gap-0.5 group">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-0.5 cursor-pointer"
              onClick={goToProfile}
            >
              {/* SUPPRIMÉ LE PREMIER DIV JAUNE - GARDÉ SEULEMENT LE CONTENEUR DE LA PHOTO */}
              <div className="w-14 h-14 rounded-full border-2 border-myBlack overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                <img 
                  src={getProfilePictureUrl()} 
                  alt={user?.username || "Profile"} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    const name = user?.username || "User";
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F9EE34&color=000&bold=true&size=128`;
                  }}
                />
              </div>
              <span className="text-xs font-medium mt-1 text-myBlack dark:text-white truncate max-w-[70px]">
                {user?.username || "Utilisateur"}
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ========== HORIZONTAL SIDEBAR (Mobile) ========== */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sm:hidden fixed bottom-0 left-0 right-0 h-20 w-full flex justify-around items-center shadow-2xl border-t-2 border-gray-200 bg-white dark:bg-[#1a1a1a] dark:border-gray-700 backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95 z-50"
      >
        
        {/* MESSAGES */}
        <NavLink to="/MessagesPage">
          {({ isActive }) => (
            <motion.div 
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-1"
            >
              <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                isActive 
                  ? "bg-gradient-to-br from-black to-gray-800 dark:from-[#F9EE34] dark:to-yellow-400" 
                  : "bg-transparent"
              }`}>
                <MessageCircle className={`w-6 h-6 transition-all duration-300 ${
                  isActive 
                    ? "text-white dark:text-black" 
                    : "text-gray-600 dark:text-gray-400"
                }`} />
              </div>
              <span className={`text-[10px] font-medium transition-all duration-300 ${
                isActive 
                  ? "text-black dark:text-[#F9EE34]" 
                  : "text-gray-600 dark:text-gray-400"
              }`}>
                {t("sidebar.Message")}
              </span>
            </motion.div>
          )}
        </NavLink>

        {/* OWLY AI */}
        <NavLink to="/assistant">
          {({ isActive }) => (
            <motion.div 
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-1"
            >
              <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                isActive 
                  ? "bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/50" 
                  : "bg-transparent"
              }`}>
                <Sparkles className={`w-6 h-6 transition-all duration-300 ${
                  isActive 
                    ? "text-white" 
                    : "text-gray-600 dark:text-gray-400"
                }`} />
              </div>
              <span className={`text-[10px] font-medium transition-all duration-300 ${
                isActive 
                  ? "text-purple-600 dark:text-purple-400" 
                  : "text-gray-600 dark:text-gray-400"
              }`}>
                Owly AI
              </span>
            </motion.div>
          )}
        </NavLink>

        {/* JEUX */}
        <NavLink to="/games">
          {({ isActive }) => (
            <motion.div 
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-1"
            >
              <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                isActive 
                  ? "bg-gradient-to-br from-green-600 to-teal-600 shadow-lg shadow-green-500/50" 
                  : "bg-transparent"
              }`}>
                <Gamepad2 className={`w-6 h-6 transition-all duration-300 ${
                  isActive 
                    ? "text-white" 
                    : "text-gray-600 dark:text-gray-400"
                }`} />
              </div>
              <span className={`text-[10px] font-medium transition-all duration-300 ${
                isActive 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-gray-600 dark:text-gray-400"
              }`}>
                Jeux
              </span>
            </motion.div>
          )}
        </NavLink>

        {/* MENU BURGER */}
        <div className="flex flex-col items-center gap-1 relative">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen(!menuOpen)}
            className={`p-2.5 rounded-xl transition-all duration-300 ${
              menuOpen 
                ? "bg-gradient-to-br from-black to-gray-800 dark:from-[#F9EE34] dark:to-yellow-400" 
                : "bg-transparent"
            }`}
          >
            <motion.div
              animate={menuOpen ? { rotate: 90 } : { rotate: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Menu className={`w-6 h-6 transition-all duration-300 ${
                menuOpen 
                  ? "text-white dark:text-black" 
                  : "text-gray-600 dark:text-gray-400"
              }`} />
            </motion.div>
          </motion.button>
          <span className={`text-[10px] font-medium transition-all duration-300 ${
            menuOpen 
              ? "text-black dark:text-[#F9EE34]" 
              : "text-gray-600 dark:text-gray-400"
          }`}>
            Menu
          </span>

          {/* MENU POPUP */}
          <AnimatePresence>
            {menuOpen && (
              <>
                {/* Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                  onClick={() => setMenuOpen(false)}
                />

                {/* Menu */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="fixed bottom-24 right-4 w-72 p-6 rounded-2xl shadow-2xl bg-white dark:bg-[#2E2F2F] z-50 border border-gray-200 dark:border-gray-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Menu</h3>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setMenuOpen(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      ×
                    </motion.button>
                  </div>

                  {/* Profile - PHOTO CLIQUABLE VERS /settings?section=profil */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      goToProfile();
                    }}
                    className="w-full focus:outline-none text-left"
                  >
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 mb-4 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 cursor-pointer"
                    >
                      {/* SUPPRIMÉ LE PREMIER DIV JAUNE ICI AUSSI */}
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-myBlack">
                        <img 
                          src={getProfilePictureUrl()} 
                          alt={user?.username || "Profile"} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            const name = user?.username || "User";
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F9EE34&color=000&bold=true&size=128`;
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[160px]">
                          {user?.username || "Utilisateur"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Voir le profil</p>
                      </div>
                    </motion.div>
                  </button>

                  {/* Menu Items */}
                  <div className="space-y-2">
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <NavLink 
                        to="/settings" 
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition group" 
                        onClick={() => setMenuOpen(false)}
                      >
                        <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-600 group-hover:bg-gray-300 dark:group-hover:bg-gray-500 transition">
                          <Settings className="w-5 h-5 text-gray-700 dark:text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-white">{t("sidebar.Paramètres")}</span>
                      </NavLink>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <NavLink 
                        to="/games" 
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition group" 
                        onClick={() => setMenuOpen(false)}
                      >
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition">
                          <Gamepad2 className="w-5 h-5 text-green-700 dark:text-green-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-white">{t("sidebar.Jeux")}</span>
                      </NavLink>
                    </motion.div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}