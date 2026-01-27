import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Star, Archive, Lock, Ban, Trash2 } from "lucide-react";
import { FaChevronRight } from "react-icons/fa";
import MediaDocument from "./MediaDocument";
import { relationService } from "../services/relationService";
import { useAuth } from "../hooks/useAuth"; 
import { useBlockStatus } from "../hooks/useBlockStatut";
import ConfirmBlockModal from "./ConfirmBlockModal";
import { userService } from "../services/userService";
import { addFavorite, removeFavorite, getFavorites } from "../services/favoritesService";

export default function InfoContactModal({ chat, onClose, onBlockStatusChange }) {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("info");
  const { user } = useAuth();
  const [contactData, setContactData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Trouver l'autre utilisateur
  const otherUser = chat?.isGroup ? null : chat?.participants?.find(
    participant => {
      const participantId = participant._id || participant.id;
      const currentUserId = user?._id || user?.id || user?.userId;
      return String(participantId) !== String(currentUserId);
    }
  );
  
  const otherUserId = otherUser?._id;
  
  const { isBlocked, unblock, refresh } = useBlockStatus(otherUserId);
  
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [localIsBlocked, setLocalIsBlocked] = useState(isBlocked);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionType, setActionType] = useState("block");
  const [modalUserInfo, setModalUserInfo] = useState({ name: "", avatar: "" });
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  // Fonction pour récupérer l'ID utilisateur
  const getUserId = (user) => user?._id || user?.id || user?.userId;

  // Récupérer les données du contact avec plusieurs méthodes
  useEffect(() => {
    const loadContactData = async () => {
      if (otherUserId && !chat.isGroup) {
        setLoadingProfile(true);
        try {
          // Méthode 1: Vérifie si le chat a déjà des données utilisateur
          if (chat.userData || chat.contactInfo) {
            const userData = chat.userData || chat.contactInfo;
            setContactData({
              avatar: userData.profilePicture || userData.avatar || chat.avatar,
              name: userData.name || userData.username || chat.name,
              username: userData.username || chat.name
            });
          }
          // Méthode 2: Essaye de récupérer depuis userService
          else if (userService.getUserById) {
            const userData = await userService.getUserById(otherUserId);
            setContactData({
              avatar: userData.profilePicture || userData.avatar || chat.avatar,
              name: userData.name || userData.username || chat.name,
              username: userData.username || chat.name
            });
          }
          // Méthode 3: Récupère depuis la liste des participants
          else if (chat.participants && chat.participants.length > 0) {
            const otherUser = chat.participants.find(
              p => String(p._id || p.id) === String(otherUserId)
            );
            if (otherUser) {
              setContactData({
                avatar: otherUser.profilePicture || otherUser.avatar || chat.avatar,
                name: otherUser.name || otherUser.username || chat.name,
                username: otherUser.username || chat.name
              });
            }
          }
          // Méthode 4: Utilise les données du chat par défaut
          else {
            setContactData({
              avatar: chat.avatar,
              name: chat.name,
              username: chat.name
            });
          }
        } catch (err) {
          console.error("Erreur chargement données contact:", err);
          // Fallback aux données du chat
          setContactData({
            avatar: chat.avatar,
            name: chat.name,
            username: chat.name
          });
        } finally {
          setLoadingProfile(false);
        }
      } else if (chat.isGroup) {
        // Pour les groupes, utiliser directement les données du chat
        setContactData({
          avatar: chat.avatar || chat.groupAvatar,
          name: chat.name || chat.groupName,
          username: null
        });
      }
    };

    loadContactData();
  }, [otherUserId, chat]);

  // Synchroniser le statut de blocage
  useEffect(() => {
    setLocalIsBlocked(isBlocked);
  }, [isBlocked]);

  // Vérifier si la conversation est en favoris
  useEffect(() => {
    const checkIfFavorite = async () => {
      const userId = getUserId(user);
      if (!userId || !chat?._id) {
        console.log('❌ IDs manquants pour favoris : userId=', userId, 'chatId=', chat?._id);
        return;
      }

      try {
        const response = await getFavorites(userId);
        console.log('📡 Réponse getFavorites:', response.data);
        const favorites = response.data;
        const isFav = favorites.some(fav => String(fav._id) === String(chat._id));
        setIsFavorite(isFav);
      } catch (error) {
        console.error("Erreur lors du chargement des favoris :", error);
      }
    };

    checkIfFavorite();
  }, [chat?._id, user]);

  // Fonction pour obtenir l'avatar avec fallback
  const getAvatarUrl = () => {
    if (contactData?.avatar) {
      return contactData.avatar;
    }
    if (chat.avatar) {
      return chat.avatar;
    }
    const name = getName();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F9EE34&color=000&bold=true&size=256`;
  };

  // Fonction pour obtenir le nom
  const getName = () => {
    if (contactData?.name) {
      return contactData.name;
    }
    return chat.name || chat.groupName || "Utilisateur";
  };

  // Fonction pour obtenir le username
  const getUsername = () => {
    if (chat.isGroup) {
      return null;
    }
    if (contactData?.username) {
      return `@${contactData.username}`;
    }
    const name = chat.name || "Utilisateur";
    return `@${name.replace(/\s+/g, '').toLowerCase()}`;
  };

  // Toggle favoris
  const toggleFavorite = async () => {
    const userId = getUserId(user);
    console.log('⭐ Clic sur toggleFavorite | isFavorite=', isFavorite, 'userId=', userId, 'chatId=', chat?._id);
    
    if (!userId || !chat?._id || loadingFavorite) return;

    setLoadingFavorite(true);

    try {
      if (isFavorite) {
        await removeFavorite(userId, chat._id);
        console.log('✅ Favori supprimé');
      } else {
        await addFavorite(userId, chat._id);
        console.log('✅ Favori ajouté');
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Erreur favoris :", error);
      alert("Erreur lors de la mise à jour des favoris");
    } finally {
      setLoadingFavorite(false);
    }
  };

  // Ouvrir le modal de confirmation de blocage
  const handleBlockClick = () => {
    setActionType(localIsBlocked ? "unblock" : "block");
    setModalUserInfo({
      name: getName(),
      avatar: getAvatarUrl()
    });
    setIsConfirmModalOpen(true);
  };

  // Confirmer le blocage/déblocage
  const handleConfirmBlock = async () => {
    setIsConfirmModalOpen(false);
    setIsBlocking(true);

    try {
      if (localIsBlocked) {
        await unblock();
        setLocalIsBlocked(false);
      } else {
        await relationService.blockUser(otherUserId);
        setLocalIsBlocked(true);
        refresh();
      }

      if (onBlockStatusChange) {
        onBlockStatusChange();
      }
    } catch (error) {
      console.error("Erreur blocage :", error);
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose}></div>

      {/* Zoom image */}
      {isImageOpen && (
  <div 
    className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
    onClick={() => setIsImageOpen(false)}
  >
    <div 
      className="w-{full} max-w-[300px] aspect-square rounded-full overflow-hidden shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <img 
        src={getAvatarUrl()}
        className="w-full h-full object-cover"
        alt={getName()}
      />
    </div>
  </div>
)}
      

      {/* Panel principal */}
      <div className="absolute inset-0 bg-myGray4 dark:bg-neutral-800 shadow-xl z-50 p-6 overflow-y-auto">
        {activeSection !== "media" && (
          <button className="text-2xl mb-4" onClick={onClose}>✕</button>
        )}

        {activeSection === "media" && (
          <MediaDocument
            onBack={() => setActiveSection("info")}
            conversationId={chat?._id}
          />
        )}

        {activeSection === "info" && (
          <div>
            {/* Avatar + Nom */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {loadingProfile ? (
                  <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mb-2"></div>
                ) : (
                  <div className="relative group">
                    <img
                      src={getAvatarUrl()}
                      className="w-24 h-24 rounded-full object-cover mb-2 cursor-pointer transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg"
                      onClick={() => setIsImageOpen(true)}
                      alt={getName()}
                      onError={(e) => {
                        e.target.onerror = null;
                        const name = getName();
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F9EE34&color=000&bold=true&size=256`;
                      }}
                    />
                    <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-all duration-300 pointer-events-none"></div>
                  </div>
                )}
              </div>

              <h2 className="text-lg font-semibold mt-2">
                {loadingProfile ? (
                  <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                ) : (
                  getName()
                )}
              </h2>
              
              {/* Username (seulement pour conversations individuelles) */}
              {!chat.isGroup && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {loadingProfile ? (
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-1"></div>
                  ) : (
                    getUsername()
                  )}
                </p>
              )}
            </div>

            {/* Menu */}
            <div className="text-sm space-y-1 mt-4">
              {/* Médias et Documents */}
              <div
                className="cursor-pointer py-2 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setActiveSection("media")}
              >
                <div className="flex items-center justify-between">
                  {t("infoContactModal.mediaDocuments")}
                  <FaChevronRight className="text-gray-400" />
                </div>
              </div>

              <hr className="border-gray-300" />

              {/* Thèmes */}
              <div
                className="cursor-pointer py-2 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => {
                  chat.openTheme?.();
                  onClose();
                }}
              >
                <div className="flex items-center justify-between">
                  {t("infoContactModal.themes")}
                  <FaChevronRight className="text-gray-400" />
                </div>
              </div>

              <hr className="border-gray-300" />

              {/* Favoris */}
              {!chat.isGroup && (
                <div
                  className={`cursor-pointer flex items-center gap-2 py-2 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ${
                    isFavorite ? "text-yellow-500" : ""
                  }`}
                  onClick={toggleFavorite}
                >
                  <Star size={15} fill={isFavorite ? "currentColor" : "none"} />
                  <span>
                    {loadingFavorite
                      ? "Chargement..."
                      : isFavorite
                      ? "Retirer des favoris"
                      : "Ajouter aux favoris"}
                  </span>
                </div>
              )}

              {/* Archiver */}
              <div
                className="cursor-pointer flex items-center gap-2 py-2 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={async () => {
                  const message = chat.isArchived
                    ? "Désarchiver cette conversation ?"
                    : "Archiver cette conversation ?";

                  if (window.confirm(message)) {
                    try {
                      await chat.onArchive?.();
                      onClose();
                    } catch (err) {
                      alert("Erreur lors de l'archivage");
                    }
                  }
                }}
              >
                <Archive size={15} />
                <span>
                  {chat.isArchived ? "Désarchiver" : "Archiver"} la conversation
                </span>
              </div>

              {/* Verrouiller */}
              <div className="cursor-pointer flex items-center gap-2 py-2 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <Lock size={15} />
                <span>{t("infoContactModal.lockConversation")}</span>
              </div>

              {/* Bloquer (uniquement pour conversations individuelles) */}
              {!chat.isGroup && (
                <div
                  className={`cursor-pointer flex items-center gap-2 py-2 px-2 rounded-md transition-colors duration-150 ${
                    localIsBlocked 
                      ? "text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-700"
                      : "text-red-600 hover:bg-red-100 dark:hover:bg-red-700"
                  }`}
                  onClick={handleBlockClick}
                >
                  <Ban size={15} />
                  <span>
                    {isBlocking
                      ? (localIsBlocked
                          ? (t("infoContactModal.unblocking") || "Déblocage...")
                          : (t("infoContactModal.blocking") || "Blocage...")
                        )
                      : (localIsBlocked
                          ? (t("infoContactModal.unblock") || "Débloquer")
                          : (t("infoContactModal.block") || "Bloquer")
                        )
                    }
                  </span>
                </div>
              )}

              {/* Supprimer */}
              <div className="cursor-pointer flex items-center gap-2 py-2 px-2 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-700">
                <Trash2 size={15} />
                <span>{t("infoContactModal.deleteConversation")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation blocage */}
        <ConfirmBlockModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmBlock}
          actionType={actionType}
          userInfo={modalUserInfo}
        />
      </div>
    </>
  );
}