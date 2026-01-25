import { FaArrowLeft, FaUserSlash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { relationService } from "../services/relationService";
import UnblockUserModal from "../components/UnblockUserModal.jsx";
export default function UtilisateursBloques({ setPrivacySubPage }) {
  const { t } = useTranslation();
 const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
const [selectedUser, setSelectedUser] = useState(null);

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
      // Retirer de la liste localement
      setBlockedUsers(prev => prev.filter(u => u.contactId._id !== contactId));
    } catch (err) {
      console.error("Erreur lors du déblocage:", err);
    }
  };

  return (
    <div
      className="
        w-full bg-myGray4 dark:bg-mydarkGray3
        rounded-xl shadow-md 
        border border-myGray4 dark:border-gray-700
        p-6 h-[400px] overflow-auto
        flex flex-col
      "
    >
      {/* TITRE + RETOUR */}
      <div className="flex items-center gap-3 mb-6">
        <FaArrowLeft
           onClick={() => setPrivacySubPage(null)}
          className="w-5 h-5 cursor-pointer text-myBlack dark:text-white"
        />
        <h1 className="text-xl font-semibold text-myBlack dark:text-white">
          {t("privacy.BlockedUsersTitle")}
        </h1>
      </div>
      {/* LOADING */}
      {loading && (
        <div className="text-center text-gray-500 mt-10">
          Chargement...
        </div>
      )}

      {/* CONTENU */}
      {!loading && blockedUsers.length === 0 &&(
        <div className="flex flex-col items-center justify-center mt-16 text-center gap-4">
          {/* Icône avec background plus grand et coins arrondis */}
          <div className="bg-myYellow w-20 h-20 flex items-center justify-center rounded-lg">
            <FaUserSlash className="text-black w-10 h-10" />
          </div>

          {/* Texte */}
          <span className="text-gray-500 text-sm font-semibold">
            {t("privacy.NoBlockedUsers")}
          </span>
          <span className="text-gray-400 text-xs mt-1 line-clamp-2">
            {t("privacy.BlockedUsersDescription")}
          </span>
        </div>
      ) } 
        {!loading && blockedUsers.length > 0 && (
        <div className="flex flex-col gap-4">
          {blockedUsers.map((item) => {
            const user = item.contactId;

            return (
              <div
                key={item._id}
                className="flex items-center justify-between border-b border-gray-300 dark:border-gray-700 pb-3"
              >
                {/* profil */}
                <div className="flex items-center gap-3">
                  <img
                    src={user.profilePicture || "/default-avatar.png"}
                    className="w-10 h-10 rounded-full object-cover"
                    alt="user"
                  />
                  <span className="text-sm text-myBlack dark:text-gray-300 font-medium">
                    {user.username}
                  </span>
                </div>

                {/* bouton débloquer */}
                <button
                 
                  
                  onClick={() => {
                              setSelectedUser(user);
                               setShowModal(true);
                  }}

                  className="text-red-500 text-sm hover:underline"
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

    </div>
    
  );
}
