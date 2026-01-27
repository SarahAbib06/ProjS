// src/components/ParametresConfidentialite.jsx
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";
import { ChevronRight, Clock, Eye, UserX, Lock, Delete } from "lucide-react";
import { motion } from "framer-motion";

export default function ParametresConfidentialite({
  setSelectedMenu,
  setPrivacySubPage,
  dernierConnexionChoice,
  statutChoice
}) {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0, y: 100 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 160,
        damping: 25,
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: 100,
      transition: { duration: 0.5 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
  };

  const privacyItems = [
    {
      id: "lastLogin",
      icon: Clock,
      title: t("parametresConfidentialite.LastLogin"),
      description: dernierConnexionChoice === "Tout le monde"
        ? t("derniereConnexion.Everyone")
        : t("derniereConnexion.NoOne"),
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10"
    },
    {
      id: "statut",
      icon: Eye,
      title: t("parametresConfidentialite.Status"),
      description: statutChoice === "Tout le monde"
        ? t("statut.Everyone")
        : t("statut.NoOne"),
      iconColor: "text-green-500",
      iconBg: "bg-green-500/10"
    },
    {
      id: "blockedUsers",
      icon: UserX,
      title: t("parametresConfidentialite.BlockedUsers"),
      description: `2 ${t("parametresConfidentialite.BlockedUsersCount")}`,
      iconColor: "text-red-500",
      iconBg: "bg-red-500/10"
    },
    {
      id: "ModefierMotDePasse",
      icon: Lock,
      title: t("parametresConfidentialite.ChangePassword"),
      description: t("parametresConfidentialite.ChangePasswordDesc"),
      iconColor: "text-orange-500",
      iconBg: "bg-orange-500/10"
    },
        {
      id: "SupprimerCompte",
      icon: Delete,
      title: t("parametresConfidentialite.DeleteAccount"),
      description: t("parametresConfidentialite.DeleteAccountDesc"),
      iconColor: "text-red-500",
      iconBg: "bg-red-500/10"
    }
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      className="
        w-full
        bg-myGray4 dark:bg-mydarkGray3
        rounded-xl 
        shadow-md 
        border border-myGray4 dark:border-gray-700
        p-6
        h-auto max-h-[100vh]
        overflow-auto
      "
    >
      {/* Header */}
      <div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-6">
          <div
            whileHover={{ x: -5, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <FaArrowLeft
              onClick={() => setSelectedMenu(null)}
              className="w-5 h-5 text-myBlack dark:text-white cursor-pointer lg:hidden"
            />
          </div>
          <h1 className="text-2xl font-semibold text-myBlack dark:text-white">
            {t("parametresConfidentialite.Title")}
          </h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {t("parametresConfidentialite.Description")}
        </p>
      </div>

      {/* Privacy Items */}
      <div className="mt-6 flex flex-col gap-3">
        {privacyItems.map((item, index) => {
          const Icon = item.icon;
          
          return (
            <div
              key={item.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => setPrivacySubPage(item.id)}
              className="
                flex items-center justify-between p-4 rounded-xl cursor-pointer
                bg-white dark:bg-[#2E2F2F]
                border border-gray-200 dark:border-gray-700
                hover:border-gray-300 dark:hover:border-gray-600
                transition-all duration-200
                group
              "
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Icon with background */}
                <div
                  whileHover={{ rotate: 5 }}
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${item.iconBg}
                  `}
                >
                  <Icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>

                {/* Text content */}
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-medium text-myBlack dark:text-white">
                    {item.title}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {item.description}
                  </span>
                </div>
              </div>

              {/* Arrow icon */}
              <div
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}