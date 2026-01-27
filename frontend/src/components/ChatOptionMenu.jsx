import { useTranslation } from "react-i18next";
import { Info, Star, Archive, Lock, Ban, Trash2 } from "lucide-react";
import { relationService } from "../services/relationService";
import { useState, useEffect } from "react";
import { useBlockStatus } from "../hooks/useBlockStatut";
import ConfirmBlockModal from "./ConfirmBlockModal";
import ConfirmArchiveModal from "./ConfirmArchiveModal";
import { useChat } from "../context/ChatContext";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { conversationService } from "../services/conversationService";
import { useAuth } from "../hooks/useAuth";

// Import des fonctions favoris
import { addFavorite, removeFavorite, getFavorites } from "../services/favoritesService";

export default function ChatOptionsMenu({
  selectedChat = {},
  onClose,
  onOpenSearch,
  onBlockStatusChange,
}) {
  const { t } = useTranslation();
  const { archiveConversation, unarchiveConversation } = useChat();
  const { user } = useAuth();

  const [isBlocking, setIsBlocking] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionType, setActionType] = useState("block");
  const [modalUserInfo, setModalUserInfo] = useState({ name: "Utilisateur", avatar: "/default-avatar.png" });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  // États pour les favoris
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  const userId = selectedChat?.userId || selectedChat?.participants?.find(p => p?._id !== localStorage.getItem('userId'))?._id;

  const { isBlocked, unblock, refresh } = useBlockStatus(userId);
  const [localIsBlocked, setLocalIsBlocked] = useState(isBlocked);

  // Fonction pour récupérer l'ID utilisateur de manière flexible
  const getUserId = (user) => user?._id || user?.id || user?.userId;

  // Fonction pour extraire le bon nom
  const getConversationName = () => {
    if (selectedChat.isGroup) {
      return selectedChat.groupName || "Groupe";
    }
    
    const otherParticipant = selectedChat.participants?.find(
      participant => {
        const participantId = participant._id || participant.id;
        const currentUserId = user?._id || user?.id || user?.userId;
        return String(participantId) !== String(currentUserId);
      }
    );
    
    return otherParticipant?.username || selectedChat.name || "Utilisateur";
  };

  useEffect(() => {
    setLocalIsBlocked(isBlocked);
  }, [isBlocked]);

  // Vérifier si la conversation est en favoris
  useEffect(() => {
    const checkIfFavorite = async () => {
      const currentUserId = getUserId(user);
      if (!currentUserId || !selectedChat?._id) {
        console.log('❌ IDs manquants pour favoris : userId=', currentUserId, 'chatId=', selectedChat?._id);
        return;
      }

      try {
        const response = await getFavorites(currentUserId);
        console.log('📡 Réponse getFavorites:', response.data);
        const favorites = response.data;
        const isFav = favorites.some(fav => String(fav._id) === String(selectedChat._id));
        setIsFavorite(isFav);
      } catch (error) {
        console.error("Erreur chargement favoris :", error);
      }
    };

    checkIfFavorite();
  }, [selectedChat?._id, user]);

  // Toggle favoris
  const toggleFavorite = async () => {
    const currentUserId = getUserId(user);
    console.log('⭐ Clic sur toggleFavorite | isFavorite=', isFavorite, 'userId=', currentUserId, 'chatId=', selectedChat?._id);

    if (!currentUserId || !selectedChat?._id || loadingFavorite) return;

    setLoadingFavorite(true);

    try {
      if (isFavorite) {
        await removeFavorite(currentUserId, selectedChat._id);
        console.log('✅ Favori supprimé');
      } else {
        await addFavorite(currentUserId, selectedChat._id);
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

  const handleBlockClick = () => {
    setActionType(localIsBlocked ? "unblock" : "block");
    setModalUserInfo({
      name: selectedChat?.name || selectedChat?.groupName || "Utilisateur",
      avatar: selectedChat?.avatar || "/default-avatar.png",
    });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmBlock = async () => {
    setIsConfirmModalOpen(false);
    setIsBlocking(true);
    try {
      if (localIsBlocked) {
        await unblock();
        setLocalIsBlocked(false);
      } else {
        if (userId) await relationService.blockUser(userId);
        setLocalIsBlocked(true);
        refresh();
      }
      onBlockStatusChange?.();
    } catch (error) {
      console.error("Erreur blocage/déblocage:", error);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleteModalOpen(false);

    if (!selectedChat?._id) {
      alert("Impossible : conversation non identifiée");
      return;
    }

    try {
      await conversationService.deleteConversationForMe(selectedChat._id);
      
      onClose();

      // Rafraîchissement de la liste
      if (typeof window.refreshConversations === 'function') {
        window.refreshConversations();
      }
    } catch (err) {
      console.error("Suppression échouée", err);
      const msg = err.response?.data?.error || err.message || "Erreur serveur";
      alert(`Échec suppression : ${msg}`);
    }
  };

  const handleArchiveClick = () => {
    setIsArchiveModalOpen(true);
  };

  const handleConfirmArchive = async () => {
    setIsArchiveModalOpen(false);
    
    try {
      if (selectedChat.isArchived) {
        await unarchiveConversation(selectedChat._id);
      } else {
        await archiveConversation(selectedChat._id);
      }
      
      onClose();
      window.location.reload();
      
    } catch (err) {
      console.error("Erreur lors de l'opération:", err);
      alert("Erreur lors de l'opération");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-30" onClick={onClose} />

      <div className="absolute right-4 top-14 w-60 bg-myGray4 dark:bg-neutral-800 shadow-xl rounded-xl p-2 z-40">

        {/* Infos sur la conversation */}
        <div
          className="flex items-center gap-2 text-xs text-gray-900 dark:text-gray-200 cursor-pointer py-2 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
          onClick={() => {
            onClose();
            selectedChat?.openInfo?.();
          }}
        >
          <Info size={15} />
          <span>Infos sur {selectedChat?.name || "la conversation"}</span>
        </div>

        {/* Toggle Favoris */}
        <div
          onClick={toggleFavorite}
          className={`flex items-center gap-2 text-xs cursor-pointer py-2 px-2 rounded-md transition-colors duration-150
            ${isFavorite
              ? "text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-700"
              : "text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            }
          `}
        >
          <Star size={15} fill={isFavorite ? "currentColor" : "none"} />
          <span>
            {isFavorite
              ? "Retirer des favoris"
              : "Ajouter aux favoris"
            }
          </span>
        </div>

        {/* Archiver/Désarchiver */}
        <div
          className="flex items-center gap-2 text-xs text-gray-900 dark:text-gray-200 cursor-pointer py-2 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
          onClick={handleArchiveClick}
        >
          <Archive size={15} />
          <span>
            {selectedChat.isArchived 
              ? t("chatOptions.unarchiveConversation") || "Désarchiver la conversation"
              : t("chatOptions.archiveConversation") || "Archiver la conversation"}
          </span>
        </div>

        {/* Verrouiller la conversation */}
        <div className="flex items-center gap-2 text-xs text-gray-900 dark:text-gray-200 cursor-pointer py-2 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150">
          <Lock size={15} />
          <span>{t("chatOptions.lockConversation") || "Verrouiller la conversation"}</span>
        </div>

        <hr className="border-gray-400 dark:border-gray-700 my-1" />

        {/* Bloquer/Débloquer (uniquement pour conversations individuelles) */}
        {!selectedChat?.isGroup && (
          <div 
            className={`flex items-center gap-2 text-xs cursor-pointer py-2 px-2 rounded-md transition-colors duration-150 ${
              localIsBlocked
                ? "text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-700"
                : "text-red-600 hover:bg-red-100 dark:hover:bg-red-700"
            }`}
            onClick={handleBlockClick}
          >
            <Ban size={15} />
            <span>
              {isBlocking
                ? (localIsBlocked ? t("chatOptions.unblocking") || "Déblocage..." : t("chatOptions.blocking") || "Blocage...")
                : (localIsBlocked ? t("chatOptions.unblock") || "Débloquer" : t("chatOptions.block") || "Bloquer")
              }
            </span>
          </div>
        )}

        {/* Supprimer la conversation */}
        <div
          className="flex items-center gap-2 text-xs text-red-600 cursor-pointer py-2 px-2 rounded-md hover:bg-red-100 dark:hover:bg-red-700 transition-colors duration-150"
          onClick={handleDeleteClick}
        >
          <Trash2 size={15} />
          <span>Supprimer la conversation</span>
        </div>

        {/* Recherche */}
        <button
          onClick={() => { onOpenSearch(); onClose(); }}
          className="flex items-center gap-2 text-xs text-gray-900 dark:text-gray-200 cursor-pointer py-2 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 w-full transition-colors duration-150"
        >
          🔍 Recherche
        </button>

      </div>

      {/* Modals */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        chatName={selectedChat?.name || selectedChat?.groupName || "cette conversation"}
        chatAvatar={selectedChat?.avatar || "/default-avatar.png"}
      />

      <ConfirmBlockModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmBlock}
        actionType={actionType}
        userInfo={modalUserInfo}
      />

      <ConfirmArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={handleConfirmArchive}
        isArchived={selectedChat.isArchived}
        chatName={getConversationName()}
      />
    </>
  );
}