import { MdComputer, MdLock, MdNotifications, MdHelp, MdLogout } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { profileService } from "../services/profileService";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
 
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
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const menuItems = [
    { id: "general", icon: MdComputer, label: t("parametresMenu.General") },
    { id: "privacy", icon: MdLock, label: t("parametresMenu.Confidentialite") },
    { id: "notif", icon: MdNotifications, label: t("parametresMenu.Notifications") },
    { id: "help", icon: MdHelp, label: t("parametresMenu.Aide") },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.06
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { 
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

return (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={containerVariants}
    className="
      w-full md:w-[320px] 
      bg-myGray4 dark:bg-mydarkGray3
      rounded-2xl 
      shadow-xl shadow-black/5 dark:shadow-black/20
      border border-gray-200/50 dark:border-gray-700/50
      backdrop-blur-sm
      p-6
      flex flex-col
      gap-6
      h-[500px]
      sticky top-6
      overflow-hidden
    "
  >
      {/* Gradient d'arrière-plan subtil */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F9EE34]/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      
      <div className="relative z-10">
        {/* TITRE PARAMETRES */}
        <motion.div 
          variants={itemVariants}
          className="text-xl font-semibold text-myBlack dark:text-white mb-1 tracking-tight"
        >
          {t("parametresMenu.Title")}
        </motion.div>

        {/* PHOTO + NOM */}
        <motion.div 
          variants={itemVariants}
          className="flex items-center gap-4 mt-4 mb-2"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#F9EE34] to-[#F9EE34]/60 rounded-full blur-md opacity-40" />
            <img
              src={preview || profilePicture || ""}
              alt="profile"
              className="relative w-16 h-16 rounded-full object-cover border-2 border-[#F9EE34] shadow-lg"
            />
          </motion.div>
          <motion.button
            onClick={() => setSelected("profil")}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="font-semibold text-lg text-myBlack dark:text-white  transition-colors cursor-pointer group"
          >
            <span className="relative">
              {name}
              <motion.span 
                className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-myBlack group-hover:w-full transition-all duration-300"
              />
            </span>
          </motion.button>
        </motion.div>

        {/* MENU */}
        <motion.div 
          variants={itemVariants}
          className="border-t border-gray-300/40 dark:border-gray-700/40 pt-5 flex flex-col gap-1.5"
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = selected === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => setSelected(item.id)}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={`
                  flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200
                  relative overflow-hidden group
                  ${isSelected 
                    ? "shadow-md shadow-[#F9EE34]/20" 
                    : "hover:bg-gray-200/60 dark:hover:bg-gray-700/40"
                  }
                `}
              >
                {/* Fond animé pour l'élément sélectionné */}
                {isSelected && (
                  <motion.div
                    layoutId="selectedBackground"
                    className="absolute inset-0 bg-gradient-to-r from-[#F9EE34] to-[#F9EE34]/90"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                
                {/* Effet de survol pour les non-sélectionnés */}
                {!isSelected && (
                  <motion.div
                    className="absolute inset-0 bg-[#F9EE34] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  />
                )}

                {/* Icône avec animation */}
                <div
                  animate={isSelected ? { 
                    scale: [1, 1.1, 1],
                    rotate: [0, -5, 5, 0] 
                  } : {}}
                  transition={{ duration: 0.5 }}
                  className="relative z-10"
                >
                  <Icon className={`
                    w-5 h-5 transition-colors duration-200
                    ${isSelected 
                      ? "text-[var(--color-myBlack)]" 
                      : "text-gray-600 dark:text-gray-300 group-hover:text-myBlack dark:group-hover:text-myBlack"
                    }
                  `} />
                </div>

                {/* Label */}
                <span className={`
                  text-sm font-medium relative z-10 transition-colors duration-200
                  ${isSelected 
                    ? "text-[var(--color-myBlack)]" 
                    : "text-gray-700 dark:text-gray-300 group-hover:text-myBlack dark:group-hover:text-myBlack"
                  }
                `}>
                  {item.label}
                </span>

                {/* Indicateur visuel pour l'élément sélectionné */}
                {isSelected && (
                  <motion.div
                    layoutId="selectedIndicator"
                    className="absolute right-3 w-1.5 h-1.5 bg-[var(--color-myBlack)] rounded-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </motion.button>
            );
          })}

          {/* TRAIT SEPARATEUR */}
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-gray-300/40 dark:border-gray-700/40 my-2"
          />

          {/* DÉCONNEXION */}
          <motion.button
            onClick={handleLogout}
            whileHover={{ x: 4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="
              flex items-center gap-3 p-3.5 rounded-xl 
              hover:bg-red-50 dark:hover:bg-red-900/20 
              transition-all duration-200
              relative overflow-hidden group
              border border-transparent hover:border-red-200 dark:hover:border-red-800/40
            "
          >
            {/* Effet de survol */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            />

            {/* Icône avec rotation */}
            <motion.div
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.4 }}
              className="relative z-10"
            >
              <MdLogout className="w-5 h-5 text-red-600 dark:text-red-500" />
            </motion.div>

            {/* Label */}
            <span className="text-sm font-medium text-red-600 dark:text-red-500 relative z-10">
              {t("parametresMenu.Deconnexion")}
            </span>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}