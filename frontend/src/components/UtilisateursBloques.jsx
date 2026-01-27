import { FaArrowLeft, FaUserSlash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { relationService } from "../services/relationService";
import UnblockUserModal from "../components/UnblockUserModal.jsx";

export default function UtilisateursBloques({ setPrivacySubPage }) {
  const { t } = useTranslation();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

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

  // Charger la liste
  useEffect(() => {
    const fetchBlocked = async () => {
      try {
        const users = await relationService.getBlockedUsers();
        setBlockedUsers(users);
      } catch (err) {
        console.error("Erreur lors du chargement:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlocked();
  }, []);

  // Débloquer utilisateur
  const handleUnblock = async (contactId) => {
    try {
      await relationService.unblockUser(contactId);
      setBlockedUsers(prev => prev.filter(u => u.contactId._id !== contactId));
    } catch (err) {
      console.error("Erreur lors du déblocage:", err);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      className="
        w-full bg-myGray4 dark:bg-mydarkGray3
        rounded-xl shadow-md 
        border border-myGray4 dark:border-gray-700
        p-6 h-[400px] overflow-auto
        flex flex-col
      "
    >
      {/* TITRE + RETOUR */}
      <div variants={itemVariants} className="mb-6">
        <div className="flex items-center gap-3">
          <div>
            <FaArrowLeft
              onClick={() => setPrivacySubPage(null)}
              className="w-5 h-5 cursor-pointer text-myBlack dark:text-white"
            />
          </div>
          <h1 className="text-xl font-semibold text-myBlack dark:text-white">
            {t("privacy.BlockedUsersTitle")}
          </h1>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div 
          variants={itemVariants}
          className="text-center text-gray-500 dark:text-gray-400 mt-10 font-medium"
        >
          Chargement...
        </div>
      )}

      {/* CONTENU VIDE */}
      {!loading && blockedUsers.length === 0 && (
        <div 
          variants={itemVariants}
          className="flex flex-col items-center justify-center mt-16 text-center gap-6 flex-1"
        >
          <div 
            whileHover={{ scale: 1.05 }}
            className="bg-myYellow w-24 h-24 flex items-center justify-center rounded-2xl shadow-lg border border-myYellow/30"
          >
            <FaUserSlash className="text-myBlack w-12 h-12" />
          </div>

          <span 
            variants={itemVariants}
            className="text-gray-600 dark:text-gray-300 text-lg font-bold"
          >
            {t("privacy.NoBlockedUsers")}
          </span>
          <span 
            variants={itemVariants}
            className="text-gray-500 dark:text-gray-400 text-sm max-w-xs line-clamp-2"
          >
            {t("privacy.BlockedUsersDescription")}
          </span>
        </div>
      )} 

      {/* LISTE UTILISATEURS */}
      {!loading && blockedUsers.length > 0 && (
        <div 
          variants={itemVariants}
          className="flex flex-col gap-4"
        >
          {blockedUsers.map((item, index) => {
            const user = item.contactId;

            return (
              <div
                key={item._id}
                variants={itemVariants}
                custom={index}
                className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#2E2F2F] border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                {/* Profil */}
                <div className="flex items-center gap-3">
                  <img
                    whileHover={{ scale: 1.05 }}
                    src={user.profilePicture || "/default-avatar.png"}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-gray-200 dark:ring-gray-700 shadow-md"
                    alt="user"
                  />
                  <span 
                    whileHover={{ x: 2 }}
                    className="text-sm font-semibold text-myBlack dark:text-gray-200"
                  >
                    {user.username}
                  </span>
                </div>

                {/* Bouton débloquer */}
                <button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedUser(user);
                    setShowModal(true);
                  }}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-red-400"
                >
                  {t("privacy.Unblock")}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <UnblockUserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        user={selectedUser}
        onConfirm={() => {
          handleUnblock(selectedUser._id);
          setShowModal(false);
        }}
      />
    </motion.div>
  );
}
