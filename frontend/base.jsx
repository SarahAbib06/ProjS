commit 464cbc25cab4b396916667d872b876c945e11149
Author: SarahAbib06 <sarah.abib@fgei.ummto.dz>
Date:   Tue Jan 6 21:12:01 2026 +0100

    Video/audio call fonctionnel + messages d'appel dans la conv+ enregistrement dans la bdd

diff --git a/src/components/AudioCall.jsx b/src/components/AudioCall.jsx
index d100776..929b126 100644
--- a/src/components/AudioCall.jsx
+++ b/src/components/AudioCall.jsx
@@ -11,6 +11,7 @@ export default function AudioCall() {
   const [isMuted, setIsMuted] = useState(false);
   const [callDuration, setCallDuration] = useState(0);
   const [isPeerConnected, setIsPeerConnected] = useState(false);
+  const [callStartTime, setCallStartTime] = useState(null); // ­ƒåò HEURE DE D├ëBUT D'APPEL
 
   const pcRef = useRef(null);
   const localStreamRef = useRef(null);
@@ -79,14 +80,14 @@ export default function AudioCall() {
   const handleEndCall = () => {
     console.log("­ƒô× Raccrochage de l'appel vocal...");
     
-    // ­ƒåò ENVOYER LE MESSAGE D'APPEL TERMIN├ë AVEC LA DUR├ëE
-    // Le r├®cepteur peut aussi envoyer le message, mais il sera cr├®├® par l'initiateur
+    // ­ƒåò ENVOYER LE MESSAGE D'APPEL TERMIN├ë AVEC LA DUR├ëE ET L'HEURE DE D├ëBUT
     if (globalSocket?.connected) {
       globalSocket.emit("call-ended", {
         conversationId: currentCall.conversation?._id,
         callType: "audio",
         duration: callDuration,
-        initiatorId: currentCall?.isInitiator ? user._id : currentCall?.targetUserId
+        initiatorId: currentCall?.isInitiator ? user._id : currentCall?.targetUserId,
+        startTime: callStartTime // ­ƒåò AJOUT DE L'HEURE DE D├ëBUT
       });
     }
     
@@ -103,6 +104,14 @@ export default function AudioCall() {
     endCall();
   };
 
+  // ­ƒåò ENREGISTRER L'HEURE DE D├ëBUT QUAND L'APPEL COMMENCE
+  useEffect(() => {
+    if (currentCall && !callStartTime && (isPeerConnected || callDuration > 0)) {
+      setCallStartTime(new Date());
+      console.log("ÔÅ▒´©Å Heure de d├®but d'appel audio enregistr├®e:", new Date().toISOString());
+    }
+  }, [currentCall, isPeerConnected, callDuration]);
+
   const toggleMute = () => {
     if (!localStreamRef.current) return;
     const audioTracks = localStreamRef.current.getAudioTracks();
@@ -698,4 +707,4 @@ export default function AudioCall() {
       `}</style>
     </div>
   );
-}
+}
\ No newline at end of file
diff --git a/src/components/VideoCall.jsx b/src/components/VideoCall.jsx
index b0d490f..64a4240 100644
--- a/src/components/VideoCall.jsx
+++ b/src/components/VideoCall.jsx
@@ -24,6 +24,7 @@ export default function VideoCall() {
   const [callState, setCallState] = useState('initiating'); // initiating, waiting_peer, exchanging, connected, failed
   const [isFullscreen, setIsFullscreen] = useState(false);
   const [isMinimized, setIsMinimized] = useState(false);
+  const [callStartTime, setCallStartTime] = useState(null); // ­ƒåò HEURE DE D├ëBUT D'APPEL
 
   const pcRef = useRef(null);
   const localVideoRef = useRef(null);
@@ -111,14 +112,14 @@ export default function VideoCall() {
   const handleEndCall = () => {
     console.log("­ƒô× Fin appel vid├®o");
     
-    // ­ƒåò ENVOYER LE MESSAGE D'APPEL TERMIN├ë AVEC LA DUR├ëE
-    // Le r├®cepteur peut aussi envoyer le message, mais il sera cr├®├® par l'initiateur
+    // ­ƒåò ENVOYER LE MESSAGE D'APPEL TERMIN├ë AVEC LA DUR├ëE ET L'HEURE DE D├ëBUT
     if (globalSocket?.connected) {
       globalSocket.emit("call-ended", {
         conversationId: currentCall.conversation?._id,
         callType: "video",
         duration: callDuration,
-        initiatorId: currentCall?.isInitiator ? user._id : currentCall?.targetUserId
+        initiatorId: currentCall?.isInitiator ? user._id : currentCall?.targetUserId,
+        startTime: callStartTime // ­ƒåò AJOUT DE L'HEURE DE D├ëBUT
       });
     }
     
@@ -206,6 +207,14 @@ export default function VideoCall() {
     }
   };
 
+  // ­ƒåò ENREGISTRER L'HEURE DE D├ëBUT QUAND L'APPEL COMMENCE
+  useEffect(() => {
+    if (currentCall && !callStartTime && (isPeerConnected || callState === 'connected')) {
+      setCallStartTime(new Date());
+      console.log("ÔÅ▒´©Å Heure de d├®but d'appel enregistr├®e:", new Date().toISOString());
+    }
+  }, [currentCall, isPeerConnected, callState]);
+
   const createPeerConnection = () => {
     try {
       console.log("­ƒöù Cr├®ation PeerConnection vid├®o...");
// frontend/src/components/ChatWindow.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  Send,
  Loader2,
  X,
  CornerUpRight,
  Pin,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMessages } from "../hooks/useMessages";
import { useTyping } from "../hooks/useTyping";
import { useReactions } from "../hooks/useReactions";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { useAuth } from "../hooks/useAuth";
import socketService from "../services/socketService";
import ThemeSelector from "./ThemeSelector";
import AudioMessage from "./AudioMessage";
import ChatOptionsMenu from "./ChatOptionMenu";
import InfoContactModal from "./InfoContactModal";
import { motion } from "framer-motion";
import { FiSearch } from "react-icons/fi";

import { Archive } from "lucide-react";
import { useChat } from "../context/ChatContext"; // ÔåÉ AJOUTE CET IMPORT
import EmojiPicker from 'emoji-picker-react';


import { useBlockStatus } from "../hooks/useBlockStatut";
import ConfirmBlockModal from "./ConfirmBlockModal";
import ForwardModal from "./ForwardModal";
import { useConversations } from "../hooks/useConversations";
import MessageRequestBanner from "./MessageRequestBanner";
import Modal from "./Modal";


const SeenIconGray = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 48 48">
    <path
      d="M14 27L7 20l1.6-1.6 5.4 5.4 9.5-9.5 1.6 1.6-12 12z"
      fill="none"
      stroke="#9e9e9e"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M25 27l-4-4 1.6-1.6 4 4 10-10 1.6 1.6-12 12z"
      fill="none"
      stroke="#9e9e9e"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Format date
const formatDateLabel = (dateString, t) => {
  if (!dateString) return "";
  const msgDate = new Date(dateString);
  const today = new Date();
  const diff = today.setHours(0, 0, 0, 0) - msgDate.setHours(0, 0, 0, 0);

  if (diff === 0) return t("chat.today") || "Aujourd'hui";
  if (diff === 86400000) return t("chat.yesterday") || "Hier";

  return msgDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatAudioDuration = (seconds) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const isDarkColor = (color) => {
  if (!color) return false;
  let r, g, b;
  if (color.startsWith("#") && color.length === 7) {
    r = parseInt(color.substr(1, 2), 16);
    g = parseInt(color.substr(3, 2), 16);
    b = parseInt(color.substr(5, 2), 16);
  } else return false;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
};

// Fichier ÔåÆ Base64
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

const EMOJI_REACTIONS = ["­ƒæì", "ÔØñ´©Å", "­ƒÿé", "­ƒÿ«", "­ƒÿó", "­ƒÿí", "­ƒöÑ", "­ƒÄë"];

// Composant Typing Indicator
const TypingIndicator = ({ avatar, username }) => (
  <div className="flex justify-start items-start gap-2 mb-3">
    {/* Avatar */}
    <div className="w-8 h-8 flex-shrink-0">
      <img
        src={avatar || "/default-avatar.png"}
        alt={username || "Utilisateur"}
        className="w-8 h-8 rounded-full object-cover"
      />
    </div>
    
    {/* Bulle de message avec animation */}
    <div className="flex flex-col max-w-[70%]">
      {username && !selectedChat?.isGroup && (
        <p className="text-[10px] ml-1 mb-1 text-gray-700 dark:text-gray-300">
          {username}
        </p>
      )}
      
      <div className="bg-myGray4 dark:bg-[#2E2F2F] rounded-t-lg rounded-br-lg rounded-bl-none px-4 py-3">
        <div className="flex items-center gap-1">
          {/* Animation des trois points */}
          <div className="flex items-center gap-1">
            <div 
              className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            ></div>
            <div 
              className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            ></div>
            <div 
              className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Timestamp (optionnel) */}
      <div className="text-[10px] mt-1 text-gray-500 dark:text-gray-400">
        {new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  </div>
);

export default function ChatWindow({ selectedChat, onBack }) {
  const { t } = useTranslation();
  const isFromArchived = selectedChat?.isFromArchived === true;
  const { conversations, archivedConversations } = useChat();
  const isArchived = isFromArchived || archivedConversations.some(c => c._id === selectedChat?._id);
  console.log("isArchived ?", isArchived, selectedChat?._id);
  const { archiveConversation, unarchiveConversation } = useChat();

 const { user, socketConnected } = useAuth();
const [selectedTargetConversation, setSelectedTargetConversation] = useState(null);
const [showForwardModal, setShowForwardModal] = useState(false);
const [messageToForward, setMessageToForward] = useState(null);
const [deletedMessages, setDeletedMessages] = useState([]); // ajouter pour supprimer le message
// Ajoute ces deux lignes
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [messageToDelete, setMessageToDelete] = useState(null);
const [deletedForEveryone, setDeletedForEveryone] = useState([]);

const [showEmojiPicker, setShowEmojiPicker] = useState(false); //imojie

const { conversations: myConversations, loading: convLoading } = useConversations();

  const chatKey = `theme_${selectedChat?._id ?? "default"}`;
  
  // R├®cup├®rer le userId de l'autre utilisateur
  const otherUserId = selectedChat?.isGroup 
    ? null 
    : selectedChat?.participants?.find(
        participant => {
          const participantId = participant._id || participant.id;
          const currentUserId = user?._id || user?.id || user?.userId;
          return String(participantId) !== String(currentUserId);
        }
      )?._id;

  const otherParticipant = selectedChat?.isGroup
    ? null
    : selectedChat?.participants?.find(
        participant => {
          const participantId = participant._id || participant.id;
          const currentUserId = user?._id || user?.id || user?.userId;
          return String(participantId) !== String(currentUserId);
        }
      );


  //  Hook pour v├®rifier le blocage

const { isBlocked, blockedBy, unblock, refresh } = useBlockStatus(otherUserId);



console.log('­ƒöì DEBUG MESSAGE REQUEST:', {
  isMessageRequest: selectedChat?.isMessageRequest,
  messageRequestFor: selectedChat?.messageRequestFor,
  messageRequestFrom: selectedChat?.messageRequestFrom,
  currentUserId: user?.id,
  isForMe: selectedChat?.messageRequestFor?.toString() === user?.id?.toString()
});

// Ô£à CORRECTION ICI : V├®rifier que JE SUIS le destinataire (messageRequestFor)
const isIncomingMessageRequest = 
  selectedChat?.isMessageRequest === true && 
  selectedChat?.messageRequestFor?.toString() === user?.id?.toString();

console.log('­ƒÜ¿ isIncomingMessageRequest =', isIncomingMessageRequest);

// ­ƒöÑ NOUVEAU : Banni├¿re Demande de message (comme Messenger)





   const [contactStatus, setContactStatus] = useState({
  isOnline: false,
  lastSeen: null,
});

const getUserStatusText = () => {
  // ­ƒƒó Online
  if (contactStatus.isOnline) {
    return "En ligne";
  }
// ­ƒöÆ Si pas de lastSeen ET offline ÔåÆ Statut masqu├® (statusVisibility = "Personne")
  if (!contactStatus.lastSeen) {
    return ""; // ÔåÉ Ne rien afficher
  }
  // ÔÜ¬ Offline avec lastSeen
  if (contactStatus.lastSeen) {
    const last = new Date(contactStatus.lastSeen);
    const now = new Date();
    const diffMs = now - last;

    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);

    if (diffMin < 1) return "En ligne il y a quelques secondes";
    if (diffMin < 60) return `En ligne il y a ${diffMin} min`;
    if (diffHour < 24) return `En ligne il y a ${diffHour} h`;

    return "En ligne il y a longtemps";
  }

  return "En ligne il y a un moment";
};
useEffect(() => {
  if (!contactStatus.lastSeen || contactStatus.isOnline) return;

  const interval = setInterval(() => {
    // force le recalcul du texte
    setContactStatus((prev) => ({ ...prev }));
  }, 60000); // toutes les 1 min

  return () => clearInterval(interval);
}, [contactStatus.lastSeen, contactStatus.isOnline]);





console.log("selectedChat:", selectedChat, "user:", user);
const contactId = React.useMemo(() => {
  if (!selectedChat || selectedChat.isGroup || !user) return null;
  const other = selectedChat.participants.find(
    (p) => String(p._id) !== String(user._id)
);
    return other?._id || null;
  }, [selectedChat, user]);

  console.log("contactId:", contactId);

  // R├®cup├®rer le statut initial
  useEffect(() => {
    if (!contactId) return;
    console.log("­ƒº¬ TEST contactId =", contactId);

    fetch(`http://localhost:5000/api/users/${contactId}/status`)
      .then(res => res.json())
      .then(data => {
        console.log("­ƒº¬ REPONSE API STATUS =", data);
        setContactStatus({
          isOnline: data.isOnline,
          lastSeen: data.lastSeen,
        });
      })
      .catch(err => console.error("Erreur statut:", err));
  }, [contactId]);

  // Sauvegarder les messages supprim├®s
  useEffect(() => {
    if (selectedChat?._id && deletedMessages.length > 0) {
      localStorage.setItem(
        `deleted_${selectedChat._id}`,
        JSON.stringify(deletedMessages)
      );
    }
  }, [deletedMessages, selectedChat?._id]);

 const otherUserName = React.useMemo(() => {
  if (selectedChat?.isGroup) return null;
  
  // Essayer de trouver dans participants
  const otherParticipant = selectedChat?.participants?.find(
    participant => {
      const participantId = participant._id || participant.id || participant.userId;
      const currentUserId = user?._id || user?.id || user?.userId;
      return participantId && currentUserId && String(participantId) !== String(currentUserId);
    }

  );
  
  if (otherParticipant?.username) {
    return otherParticipant.username;
  }
  
  // Sinon, utiliser le nom de la conversation
  if (selectedChat?.name) {
    return selectedChat.name;
  }
  
  // Sinon, utiliser targetUser s'il existe
  if (selectedChat?.targetUser?.username) {
    return selectedChat.targetUser.username;
  }
  
  return null;
}, [selectedChat, user]);



useEffect(() => {
  const handleClickOutside = (event) => {
    if (showEmojiPicker && !event.target.closest('.EmojiPickerReact')) {
      setShowEmojiPicker(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [showEmojiPicker]);
// Apr├¿s les autres useEffect (vers la fin du composant, avant les returns), ajoute :
// ajouter pour supprimer 

  // Sauvegarder les messages supprim├®s
  useEffect(() => {
    if (selectedChat?._id && deletedMessages.length > 0) {
      localStorage.setItem(
        `deleted_${selectedChat._id}`,
        JSON.stringify(deletedMessages)
      );
    }
  }, [deletedMessages, selectedChat?._id]);

  // Charger les messages supprim├®s au d├®marrage
  useEffect(() => {
    if (selectedChat?._id) {
      const saved = localStorage.getItem(`deleted_${selectedChat._id}`);
      if (saved) {
        try {
          setDeletedMessages(JSON.parse(saved));
        } catch (e) {
          console.error("Erreur chargement messages supprim├®s:", e);
        }
      }
    }
  }, [selectedChat?._id]);

  // ├ëcouter les changements en temps r├®el via socket
  useEffect(() => {
    if (!socketService.socket || !contactId) return;
    
    window.socket = socketService.socket;
    console.log("­ƒîÉ Socket accessible via window.socket");
    
    const handleOnline = ({ userId }) => {
      if (!contactId) return;
      if (String(userId) === String(contactId)) {
        setContactStatus({
          isOnline: true,
          lastSeen: null,
        });
      }
    };

    const handleOffline = ({ userId, lastSeen }) => {
      console.log("­ƒö┤ user offline re├ºu:", userId, lastSeen, "contactId:", contactId);
      if (!contactId) return;

      if (String(userId) === String(contactId)) {
        setContactStatus({
          isOnline: false,
          lastSeen: lastSeen ? new Date(lastSeen).toISOString() : new Date().toISOString(),
        });
      }
    };

    socketService.socket.on("user:online", handleOnline);
    socketService.socket.on("user:offline", handleOffline);

    return () => {
      socketService.socket.off("user:online", handleOnline);
      socketService.socket.off("user:offline", handleOffline);
    };
  }, [contactId]);

  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [themeStyle, setThemeStyle] = useState({});
  
  // ├ëcoute les th├¿mes envoy├®s par l'autre participant
  useEffect(() => {
    if (!socketService.socket || !selectedChat) return;

    const handleThemeChange = ({ conversationId, theme }) => {
      if (conversationId === selectedChat._id) {
        console.log("Th├¿me re├ºu via socket:", theme);
        applyTheme(theme, false);
      }
    };

    socketService.socket.on("themeChanged", handleThemeChange);

    return () => {
      socketService.socket.off("themeChanged", handleThemeChange);
    };
  }, [selectedChat]);

  const [bubbleBg, setBubbleBg] = useState("");
  const [sendBtnColor, setSendBtnColor] = useState("");
  const [themeEmojis, setThemeEmojis] = useState([]);
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null); 
  const [filePreview, setFilePreview] = useState(null); 
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [openSearch, setOpenSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPinnedSection, setShowPinnedSection] = useState(false);
  
  // ├ëtats pour les interactions
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(null);

  // ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
// Gestion suppression message (AJOUTER ├çA ICI)
const handleDeleteForMe = (messageId) => {
  setDeletedMessages((prev) => {
    if (prev.includes(messageId)) return prev;
    return [...prev, messageId];
  });
  setShowMessageMenu(null);
  setShowDeleteModal(false); // ferme le modal directement
};

const handleDeleteForEveryone = async (messageId) => {
  try {
    // Optimistic : affiche d├®j├á le placeholder chez toi imm├®diatement
    setDeletedForEveryone((prev) => [...new Set([...prev, messageId])]);

    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/api/messages/${messageId}/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      // Erreur ÔåÆ on retire le placeholder chez toi
      setDeletedForEveryone((prev) => prev.filter((id) => id !== messageId));
      throw new Error(data.error || "Erreur lors de la suppression");
    }

    console.log("Message supprim├® pour tous :", data);
    setShowDeleteModal(false);

  } catch (err) {
    console.error("├ëchec suppression pour tous :", err);
    // Optionnel : petite notification toast ici si tu veux
  }
};
// ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

useEffect(() => {
  if (!socketService.socket || !selectedChat?._id) return;

  const handleMessageDeleted = (data) => {
    const { messageId, conversationId: convId } = data;

    if (convId !== selectedChat._id) return;

    // IMPORTANT : on ajoute le message ├á la liste des supprim├®s pour tout le monde
    // ÔåÆ ├ºa va d├®clencher le placeholder chez TOUT LE MONDE (toi + destinataire)
    setDeletedForEveryone((prev) => [...new Set([...prev, messageId])]);

    // Petit scroll pour que le placeholder soit visible
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  socketService.socket.on("message:deleted", handleMessageDeleted);

  return () => {
    socketService.socket.off("message:deleted", handleMessageDeleted);
  };
}, [selectedChat?._id]);

// Sauvegarde permanente des suppressions "pour tout le monde"
useEffect(() => {
  if (selectedChat?._id && deletedForEveryone.length > 0) {
    localStorage.setItem(
      `deletedEveryone_${selectedChat._id}`,
      JSON.stringify(deletedForEveryone)
    );
  }
}, [deletedForEveryone, selectedChat?._id]);

// Charge les suppressions "pour tout le monde" au d├®marrage
useEffect(() => {
  if (selectedChat?._id) {
    const saved = localStorage.getItem(`deletedEveryone_${selectedChat._id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setDeletedForEveryone(parsed);
        }
      } catch (e) {
        console.error("Erreur chargement deletedEveryone :", e);
      }
    }
  }
}, [selectedChat?._id]);

    // ­ƒöÑ AJOUT : D├®tection si c'est une demande de message
    // const otherUserId = selectedChat?.participants?.[0]?._id?.replace('direct_', '') || selectedChat?.participants?.[0]?._id || null;
    // || selectedChat?.participants?.[0]?._id; // ÔåÉ fallback important pour nouvelles conversations
     // fallback si c'est une nouvelle conversation
  // dernier recours si la cl├® contient l'ID
      console.log("selectedChat:", selectedChat);
  console.log("otherUserId:", otherUserId);

  const isMessageRequest = selectedChat?.isMessageRequest === true ||
    selectedChat?.messageRequestForMe === true;

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  const [isConfirmUnblockModalOpen, setIsConfirmUnblockModalOpen] = useState(false);

  // Hooks pour la messagerie
  const {
    messages,
    loading,
    sendMessage,
    sendImage,
    sendVideo,
    sendFile,
    loadMore,
    hasMore,
    pinMessage,
    unpinMessage,
    deleteMessage,
    forwardMessage,
  } = useMessages(selectedChat?._id);

  const { typingUsers, sendTyping, isTyping } = useTyping(selectedChat?._id);

  // Hook pour l'enregistrement audio
  const { isRecording, recordingTime, startRecording, stopAndSend, cancelRecording } =
    useAudioRecorder(selectedChat?._id);

  // Charger les messages ├®pingl├®s
  useEffect(() => {
    const pinned = messages.filter((msg) => msg.isPinned);
    setPinnedMessages(pinned);
    setShowPinnedSection(pinned.length > 0);
  }, [messages]);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    // Ce useEffect vide d├®pend de selectedChat et archivedConversations
  }, [selectedChat, archivedConversations]);

  // G├®rer la saisie avec typing indicator
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (e.target.value.length > 0) {
      sendTyping();
    }
  };

  // Envoyer un message
  const handleSendMessage = async () => {
    try {
      if (selectedFile) {
        if (selectedFile.type.startsWith("image/")) {
          await sendImage(selectedFile);
        } else if (selectedFile.type.startsWith("video/")) {
          await sendVideo(selectedFile);
        } else {
          await sendFile(selectedFile);
        }

        setSelectedFile(null);
        setFilePreview(null);
        return;
      }

      if (!inputText.trim()) return;
      await sendMessage(inputText);
      setInputText("");
    } catch (error) {
      console.error("Erreur envoi:", error);
    }
  };

  // G├®rer l'upload de fichiers
  const handleFileSelect = (e) => { 
    const file = e.target.files[0]; 
    if (!file) return; 
    
    setSelectedFile(file); 
    
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) { 
      setFilePreview(URL.createObjectURL(file)); 
    } else { 
      setFilePreview(null); 
    } 
  };

  // Enregistrement audio
  const handleMicClick = async () => {
    if (isRecording) {
      try {
        await stopAndSend();
      } catch (error) {
        console.error("Erreur envoi vocal:", error);
        alert("Erreur lors de l'envoi du message vocal");
      }
    } else {
      await startRecording();
    }
  };
  //imoji
 const onEmojiClick = (emojiObject) => {
  setInputText((prevInput) => prevInput + emojiObject.emoji);
  // Optionnel : fermer le picker apr├¿s s├®lection
  // setShowEmojiPicker(false);
};
//theme discution
 const applyTheme = React.useCallback(async (theme, save = true) => {
  console.log("Th├¿me s├®lectionn├® :", theme);
  let style = {};
  setThemeEmojis([]);


  const emojisFromTheme = theme?.emojis ?? (theme?.emoji ? [theme.emoji] : null);
 
 

  

  // Gestion upload fichier
  if (theme.type === "upload" && theme.value instanceof File) {
    const base64 = await fileToBase64(theme.value);
    style = {
      backgroundImage: `url(${base64})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
    setThemeStyle(style);
    setSendBtnColor("");
    setBubbleBg("");
    
    if (save) {
      localStorage.setItem(chatKey, JSON.stringify({ ...theme, value: base64 }));
      // ­ƒåò SAUVEGARDER DANS LE BACKEND
      await saveThemeToBackend({ ...theme, value: base64 });
    }
    return;
  }

  // Gestion image (URL ou base64)
  if ((theme.type === "image" || theme.type === "upload") && typeof theme.value === "string") {
    style = {
      backgroundImage: `url(${theme.value})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
    setThemeStyle(style);
    setSendBtnColor("");
    setBubbleBg("");
    
    if (save) {
      localStorage.setItem(chatKey, JSON.stringify(theme));
      // ­ƒåò SAUVEGARDER DANS LE BACKEND
      await saveThemeToBackend(theme);
    }
    return;
  }

  // Gestion couleurs, gradients, saisonniers
  if (theme.type === "color" || theme.type === "gradient" || theme.type === "seasonal") {
    style = { background: theme.value };
    setThemeStyle(style);
    setBubbleBg(theme.value || "");
    setSendBtnColor(theme.value || "");

    if (
      theme.type === "seasonal" &&
      emojisFromTheme &&
      Array.isArray(emojisFromTheme) &&
      emojisFromTheme.length > 0
    ) {
      setThemeEmojis(emojisFromTheme);
      const count = 35;
      const arr = Array.from({ length: count }).map((_, i) => ({
        id: `${Date.now()}_${i}`,
        left: Math.random() * 100,
        top: Math.random() * 60,
        size: 12 + Math.random() * 20,
        speed: 0.25 + Math.random() * 0.6,
        rotate: (Math.random() - 0.5) * 30,
        direction: Math.random() > 0.5 ? 1 : -1,
      }));
      setFloatingEmojis(arr);
    } else {
      setThemeEmojis([]);
      setFloatingEmojis([]);
    }

    if (save) {
      localStorage.setItem(chatKey, JSON.stringify(theme));
      // ­ƒåò SAUVEGARDER DANS LE BACKEND
      await saveThemeToBackend(theme);
    }
  }
}, [selectedChat?._id, chatKey]); // ­ƒöÑ Ajouter les d├®pendances

// 2´©ÅÔâú NOUVELLE FONCTION : Sauvegarder dans le backend
const saveThemeToBackend = async (theme) => {
  try {
    const token = localStorage.getItem("token");
    
    console.log("­ƒÆ¥ Sauvegarde th├¿me backend:", {
      conversationId: selectedChat._id,
      type: theme.type,
      hasEmojis: theme.emojis?.length > 0,
    });

    const response = await fetch("http://localhost:5000/api/themes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        conversationId: selectedChat._id,
        type: theme.type,
        value: theme.value,
        emojis: theme.emojis || (theme.emoji ? [theme.emoji] : []),
        name: theme.name || null,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("ÔØî Erreur sauvegarde th├¿me:", error);
      return;
    }

    const data = await response.json();
    console.log("Ô£à Th├¿me sauvegard├® avec succ├¿s:", data);
  } catch (error) {
    console.error("­ƒÆÑ Erreur r├®seau sauvegarde th├¿me:", error);
  }
};

// 3´©ÅÔâú NOUVELLE FONCTION : Charger depuis le backend
const loadThemeFromBackend = React.useCallback(async () => {
  try {
    const token = localStorage.getItem("token");
    
    console.log("­ƒôÑ Chargement th├¿me backend pour:", selectedChat._id);

    const response = await fetch(
      `http://localhost:5000/api/themes/${selectedChat._id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.log("Ôä╣´©Å Pas de th├¿me en backend, utilisation localStorage");
      
      // Fallback sur localStorage
      const savedTheme = localStorage.getItem(chatKey);
      if (savedTheme) {
        const parsed = JSON.parse(savedTheme);
        applyTheme(parsed, false);
      }
      return;
    }

    const data = await response.json();
    console.log("Ô£à Th├¿me charg├® depuis backend:", data);

    if (data.success && data.data) {
      const theme = {
        type: data.data.type,
        value: data.data.value,
        emojis: data.data.emojis,
        name: data.data.name,
      };
      
      // Appliquer le th├¿me SANS sauvegarder (d├®j├á en DB)
      applyTheme(theme, false);
      
      // Sync localStorage pour coh├®rence
      localStorage.setItem(chatKey, JSON.stringify(theme));
    }
  } catch (error) {
    console.error("­ƒÆÑ Erreur chargement th├¿me:", error);
    
    // Fallback sur localStorage
    const savedTheme = localStorage.getItem(chatKey);
    if (savedTheme) {
      const parsed = JSON.parse(savedTheme);
      applyTheme(parsed, false);
    }
  }
}, [selectedChat?._id, chatKey, applyTheme]); // ­ƒöÑ Ajouter les d├®pendances

// 4´©ÅÔâú MODIFIER removeTheme pour supprimer aussi du backend
const removeTheme = async () => {
  setThemeStyle({});
  setBubbleBg("");
  setSendBtnColor("");
  setThemeEmojis([]);
  setFloatingEmojis([]);
  localStorage.removeItem(chatKey);
  
  // ­ƒåò SUPPRIMER AUSSI DU BACKEND
  try {
    const token = localStorage.getItem("token");
    
    const response = await fetch(
      `http://localhost:5000/api/themes/${selectedChat._id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      console.log("Ô£à Th├¿me supprim├® du backend");
    } else {
      console.error("ÔØî Erreur suppression th├¿me backend");
    }
  } catch (error) {
    console.error("­ƒÆÑ Erreur r├®seau suppression th├¿me:", error);
  }
};

// 5´©ÅÔâú MODIFIER le useEffect de chargement (REMPLACER l'ancien)
useEffect(() => {
  if (selectedChat?._id) {
    loadThemeFromBackend();
  }
}, [selectedChat?._id, loadThemeFromBackend]); // ­ƒöÑ Ajouter loadThemeFromBackend

// 6´©ÅÔâú AJOUTER useEffect pour ├®couter les changements Socket.io (si pas d├®j├á fait)
useEffect(() => {
  if (!socketService.socket || !selectedChat) return;

  const handleThemeChanged = ({ conversationId, theme }) => {
    if (conversationId === selectedChat._id) {
      console.log("­ƒÄ¿ Th├¿me re├ºu via socket:", theme);
      
      // Appliquer le th├¿me re├ºu SANS sauvegarder (d├®j├á fait par l'├®metteur)
      applyTheme(theme, false);
      
      // Sync localStorage
      localStorage.setItem(chatKey, JSON.stringify(theme));
    }
  };


  const handleThemeRemoved = ({ conversationId }) => {
    if (conversationId === selectedChat._id) {
      console.log("­ƒùæ´©Å Th├¿me supprim├® via socket");
      
      // R├®initialiser
      setThemeStyle({});
      setBubbleBg("");
      setSendBtnColor("");
      setThemeEmojis([]);
      setFloatingEmojis([]);
      localStorage.removeItem(chatKey);
    }
  };

  socketService.socket.on("themeChanged", handleThemeChanged);
  socketService.socket.on("themeRemoved", handleThemeRemoved);

  return () => {
    socketService.socket.off("themeChanged", handleThemeChanged);
    socketService.socket.off("themeRemoved", handleThemeRemoved);
  };
}, [selectedChat, chatKey, applyTheme]); // ­ƒöÑ Ajouter les d├®pendances
  // G├®rer l'appel entrant
const handleAcceptCall = () => {
  if (!socketService.socket || !incomingCall) {
    console.error('Socket non disponible ou appel inexistant');
    return;
  }

  console.log('Ô£à Acceptation de l\'appel:', incomingCall);
  
  // ÔÜá´©Å NE ├ëMETTRE call:accept QU'UNE SEULE FOIS
  // D├®sactiver imm├®diatement pour ├®viter les doubles clics
  const callToAccept = { ...incomingCall };
  setIncomingCall(null); // Fermer la modal AVANT d'├®mettre
  
  socketService.socket.emit('call:accept', {
    callId: callToAccept.callId,
    callerId: callToAccept.callerId
  });

  // D├®finir activeCall
  setActiveCall({
    ...callToAccept,
    status: 'accepted'
  });
};

  const handleRejectCall = async () => {
    if (!socketService.socket || !incomingCall) {
      console.error('Socket non disponible ou appel inexistant');
      return;
    }

    console.log('ÔØî Rejet de l\'appel:', incomingCall);
    socketService.socket.emit('call:reject', {
      callId: incomingCall.callId,
      callerId: incomingCall.callerId
    });

    setIncomingCall(null);
  };

  // Charger le th├¿me sauvegard├®
  useEffect(() => {
  // ­ƒöÑ R├ëINITIALISER D'ABORD LE TH├êME
  const resetTheme = () => {
    setThemeStyle({});
    setBubbleBg("");
    setSendBtnColor("");
    setThemeEmojis([]);
    setFloatingEmojis([]);
  };

  // R├®initialiser avant de charger le nouveau th├¿me
  resetTheme();

  // Charger le th├¿me de la conversation actuelle
  if (selectedChat?._id) {
    loadThemeFromBackend();
  }
}, [selectedChat?._id, loadThemeFromBackend]);

  // Charger le th├¿me sauvegard├® jcp si je garde
  useEffect(() => {
    const savedTheme = localStorage.getItem(chatKey);
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        applyTheme(parsed, false);
      } catch (e) {
        console.error("Erreur chargement th├¿me:", e);
      }
    }
  }, [selectedChat]);


  // Animation des emojis flottants
  useEffect(() => {
    if (!themeEmojis || themeEmojis.length === 0) return;

    const id = setInterval(() => {
      setFloatingEmojis((prev) => {
        if (!prev || prev.length === 0) return prev;
        return prev.map((e) => {
          let newTop = e.top + e.speed * 0.25;
          if (newTop > 110) newTop = -10;
          let newLeft = e.left + 0.2 * e.direction;
          if (newLeft < 0) {
            newLeft = 0;
            e.direction = 1;
          } else if (newLeft > 100) {
            newLeft = 100;
            e.direction = -1;
          }
          const newRotate = e.rotate + (Math.random() - 0.5) * 2;
          return { ...e, top: newTop, left: newLeft, rotate: newRotate };
        });
      });
    }, 60);

    return () => clearInterval(id);
  }, [themeEmojis]);

  // ============ FONCTIONS D'APPEL VID├ëO/VOCAL ============

  // FONCTION POUR D├ëMARRER UN APPEL VID├ëO
  const handleVideoCall = () => {
    if (!selectedChat) {
      alert('Aucune conversation s├®lectionn├®e');
      return;
    }
    
    if (selectedChat.isGroup) {
      alert("Les appels de groupe ne sont pas encore disponibles");
      return;
    }
    
    if (!selectedChat.participants || selectedChat.participants.length < 2) {
      alert('Impossible de trouver le destinataire');
      return;
    }
    
    // V├®rifier les permissions AVANT de lancer l'appel
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Votre navigateur ne supporte pas les appels vid├®o');
      return;
    }
    
    // Demander la permission cam├®ra/micro
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 640 }, 
        height: { ideal: 480 } 
      }, 
      audio: true 
    })
      .then(stream => {
        // Arr├¬ter le stream temporaire (il sera red├®marr├® dans VideoCall)
        stream.getTracks().forEach(track => track.stop());
        
        // Lancer l'appel vid├®o
        console.log('­ƒô╣ Lancement appel vid├®o avec:', selectedChat.participants);
        startCall(selectedChat, 'video');
      })
      .catch(error => {
        console.error('ÔØî Erreur permission vid├®o:', error);
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          alert('Permission cam├®ra/micro requise pour l\'appel vid├®o');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          alert('Cam├®ra ou micro non d├®tect├®. V├®rifiez vos p├®riph├®riques.');
        } else {
          alert('Erreur lors de l\'acc├¿s ├á la cam├®ra/micro: ' + error.message);
        }
      });
  };

  // FONCTION POUR D├ëMARRER UN APPEL VOCAL
  const handleAudioCall = () => {
    if (!selectedChat) {
      alert('Aucune conversation s├®lectionn├®e');
      return;
    }
    
    if (selectedChat.isGroup) {
      alert("Les appels de groupe ne sont pas encore disponibles");
      return;
    }
    
    if (!selectedChat.participants || selectedChat.participants.length < 2) {
      alert('Impossible de trouver le destinataire');
      return;
    }
    
    // V├®rifier les permissions AVANT de lancer l'appel
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Votre navigateur ne supporte pas les appels vocaux');
      return;
    }
    
    // Demander la permission micro
    navigator.mediaDevices.getUserMedia({ 
      audio: { 
        echoCancellation: true,
        noiseSuppression: true 
      } 
    })
      .then(stream => {
        // Arr├¬ter le stream temporaire
        stream.getTracks().forEach(track => track.stop());
        
        // Lancer l'appel vocal
        console.log('­ƒô× Lancement appel vocal avec:', selectedChat.participants);
        startCall(selectedChat, 'audio');
      })
      .catch(error => {
        console.error('ÔØî Erreur permission audio:', error);
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          alert('Permission micro requise pour l\'appel vocal');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          alert('Micro non d├®tect├®. V├®rifiez vos p├®riph├®riques.');
        } else {
          alert('Erreur lors de l\'acc├¿s au micro: ' + error.message);
        }
      });
  };

  const bubbleClasses = (fromMe) =>
    fromMe
      ? "bg-myYellow2 dark:bg-mydarkYellow text-myBlack rounded-t-lg rounded-bl-lg rounded-br-none px-4 py-4 text-xs"
      : "bg-myGray4 dark:bg-[#2E2F2F] text-myBlack dark:!text-white rounded-t-lg rounded-br-lg rounded-bl-none px-4 py-4 text-xs";

  // Nom de la conversation
 const conversationName = selectedChat?.isGroup
    ? selectedChat.groupName
    : otherUserName || selectedChat?.name || "Utilisateur";

// Dans ChatWindow.jsx, remplacez la ligne 151 par :
const conversationAvatar = React.useMemo(() => {
  console.log("­ƒû╝´©Å DEBUG - Recherche photo de profil:");
  console.log("1. selectedChat:", selectedChat);
  console.log("2. targetUser:", selectedChat?.targetUser);
  console.log("3. targetUser.profilePicture:", selectedChat?.targetUser?.profilePicture);
  
  if (selectedChat?.isGroup) return "/group-avatar.png";
  
  // 1. Chercher dans targetUser (vient de SearchModal)
  if (selectedChat?.targetUser?.profilePicture) {
    console.log("Ô£à Photo trouv├®e dans targetUser:", selectedChat.targetUser.profilePicture);
    return selectedChat.targetUser.profilePicture;
  }
  
  // 2. Chercher dans participants
  const fromParticipants = selectedChat?.participants?.find(
    p => {
      const pid = p._id || p.id;
      const uid = otherUserId;
      return pid && uid && String(pid) === String(uid);
    }
  )?.profilePicture;
  
  if (fromParticipants) {
    console.log("Ô£à Photo trouv├®e dans participants:", fromParticipants);
    return fromParticipants;
  }
  
  console.log("ÔØî Aucune photo trouv├®e, utilisation par d├®faut");
  return "/default-avatar.png";
}, [selectedChat, otherUserId]);

  // Avatar de l'autre utilisateur pour l'indicateur
  const otherUserAvatar = selectedChat?.isGroup
    ? "/group-avatar.png"
    : selectedChat?.participants?.find(
        participant => {
          const participantId = participant._id || participant.id;
          const currentUserId = user?._id || user?.id || user?.userId;
          return String(participantId) !== String(currentUserId);
        }
      )?.profilePicture || "/default-avatar.png";

  // Composant MessageBubble
  const MessageBubble = ({ msg, deletedMessages, setDeletedMessages }) => {
    const longPressTimer = useRef(null);

    const startLongPress = () => {
      longPressTimer.current = setTimeout(() => {
        setShowMessageMenu(msg._id);
      }, 500);
    };

    const cancelLongPress = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };

    // D├®termination robuste de l'exp├®diteur
    const currentUserId = user?._id || user?.id || user?.userId;

    const rawSender =
      msg.senderId || msg.sender || msg.Id_sender || msg.Id_User || msg.userId;

    const messageSenderId =
      typeof rawSender === "object" && rawSender !== null ? rawSender._id : rawSender;

    const fromMe =
      currentUserId && messageSenderId && String(currentUserId) === String(messageSenderId);

    const { reactions, addReaction, removeReaction } = useReactions(msg._id);

    const textColor = fromMe
      ? bubbleBg
        ? isDarkColor(bubbleBg)
          ? "#fff"
          : "#000"
        : "#000"
      : themeStyle.backgroundImage
      ? "#fff"
      : themeStyle.background
      ? isDarkColor(themeStyle.background)
        ? "#fff"
        : "#000"
      : "#000";

    const isMatch =
      searchTerm && msg.content?.toLowerCase().includes(searchTerm.toLowerCase());

    const messageTime = new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const handleAddReaction = async (emoji) => {
      try {
        await addReaction(emoji);
        setShowReactionPicker(null);
      } catch (error) {
        console.error("Erreur ajout r├®action:", error);
      }
    };

    const handlePinMessage = async () => {
      try {
        if (msg.isPinned) {
          await unpinMessage(msg._id);
        } else {
          await pinMessage(msg._id);
        }
        setShowMessageMenu(null);
      } catch (error) {
        console.error("Erreur ├®pinglage:", error);
      }
    };
    
    const handleDeleteMessage = (msgId) => {
      if (window.confirm("Supprimer ce message pour moi ?")) {
        setDeletedMessages(prev => [...prev, msgId]);
        setShowMessageMenu(null);
      }
    };

    return (
      <div className={`flex ${fromMe ? "justify-end" : "justify-start"} group`}>
        <div className="flex flex-col max-w-[85%] relative">
          {!fromMe && selectedChat?.isGroup && (
            <p className="text-[10px] ml-1 mb-1 text-gray-700 dark:text-gray-300">
              {msg.senderUsername || msg.senderId?.username || "Utilisateur"}
            </p>
          )}

          <div className="relative">
            <div
              id={`message-${msg._id}`}
              className={`${bubbleClasses(fromMe)} ${
                isMatch ? "ring-2 ring-blue-400" : ""
              } cursor-pointer`}
              style={{
                background: fromMe ? bubbleBg || undefined : undefined,
                color: textColor,
              }}
              onMouseDown={startLongPress}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              onTouchStart={startLongPress}
              onTouchEnd={cancelLongPress}
              onClick={() => {
                if (showMessageMenu === msg._id) setShowMessageMenu(null);
              }}
            >
              {msg.isPinned && (
                <Pin
                  size={12}
                  className="absolute -top-1 -right-1 text-myYellow"
                />
              )}

              {msg.typeMessage === "text" && msg.content}

              {msg.typeMessage === "image" && (
                <img
                  src={msg.content} 
                  alt="image"
                  className="max-w-full rounded mt-1"
                  style={{ maxHeight: "300px" }}
                />
              )}

              {msg.typeMessage === "video" && (
                <video
                  src={msg.content} 
                  controls
                  className="max-w-full rounded mt-1"
                  style={{ maxHeight: "300px" }}
                />
              )}

              {msg.typeMessage === "audio" && (
                <AudioMessage src={msg.content || msg.fileUrl} />
              )}
              {msg.typeMessage === "file" && (
                <a
                  href={msg.content}
                  download
                  className="flex items-center gap-2 underline"
                >
                  ­ƒôÄ {msg.fileName || "Fichier"}
                </a>
              )}
            </div>

            {showMessageMenu === msg._id && (
              <div
                className={`message-menu absolute ${
                  fromMe ? "right-0" : "left-0"
                } top-full mt-1 bg-white dark:bg-neutral-800 rounded-lg shadow-xl z-50 py-1 min-w-[150px]`}
              >
                <button
                  onClick={() => {
                    console.log("­ƒƒí click R├®agir pour", msg._id);
                    setShowReactionPicker(msg._id);
                    setShowMessageMenu(null);
                  }}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-900 dark:text-white"
                >
                  <Smile size={16} /> R├®agir
                </button>
                <button
                  onClick={handlePinMessage}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-900 dark:text-white"
                >
                  <Pin size={16} />{" "}
                  {msg.isPinned ? "D├®s├®pingler" : "├ëpingler"}
                </button>
                <button
                  onClick={() => {
                    setMessageToForward(msg);
                    setSelectedTargetConversation(null);
                    setShowForwardModal(true);
                    setShowMessageMenu(null);
                  }}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-900 dark:text-white"
                >
                  <CornerUpRight size={16} /> Transf├®rer
                </button>
                {fromMe && (
                  <button
                    onClick={() => {
                      setMessageToDelete(msg._id);           // On garde l'ID du message
                      setShowDeleteModal(true);              // Ouvre le modal
                      setShowMessageMenu(null);              // Ferme le menu contextuel
                    }}
                    className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-red-600"
                  >
                    <Trash2 size={16} /> Supprimer
                  </button>
                )}
              </div>
            )}

            {showReactionPicker === msg._id && (
              <div
                className={`reaction-picker absolute ${
                  fromMe ? "right-0" : "left-0"
                } top-full mt-1 bg-white dark:bg-neutral-800 rounded-full shadow-xl z-50 px-2 py-1 flex gap-1`}
              >
                {EMOJI_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleAddReaction(emoji)}
                    className="text-xl hover:scale-125 transition-transform p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {reactions && reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {reactions.map((reaction) => (
                <div
                  key={reaction._id}
                  className="bg-white dark:bg-neutral-700 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 shadow-sm"
                >
                  <span>{reaction.emoji}</span>
                  {reaction.id_user && (
                    <span className="text-gray-600 dark:text-gray-300">
                      {reaction.id_user.username}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div
            className={`text-[10px] mt-1 flex items-center gap-1.5 ${
              fromMe ? "justify-end" : "justify-start"
            } text-gray-500 dark:text-gray-400`}
          >
            <span>{messageTime}</span>

            {fromMe && (
              <span className="flex items-center gap-1">
                {msg._id.startsWith("pending_") || msg.status === "sending" ? (
                  <span className="flex items-center gap-1 text-gray-400">
                    Ô£ô
                  </span>
                ) : (
                  <span className="text-gray-400">Ô£ôÔ£ô</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-myWhite dark:bg-neutral-900">
        <Loader2 size={48} className="animate-spin text-myYellow" />
      </div>
    );
  }

  return (
    <>
      {/* Composants d'appel */}
      {currentCall?.callType === 'video' && <VideoCall />}
      {currentCall?.callType === 'audio' && <AudioCall />}
      <IncomingCallModal />

      <div
        className="relative flex flex-col w-full h-full bg-myWhite dark:bg-neutral-900 text-myBlack dark:text-white transition-colors duration-300 min-w-[150px]"
        style={themeStyle}
      >
        {/* Floating emojis */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
        >
          {floatingEmojis.map((e) => {
            const randomEmoji =
              Array.isArray(themeEmojis) && themeEmojis.length > 0
                ? themeEmojis[Math.floor(Math.random() * themeEmojis.length)]
                : null;
            if (!randomEmoji) return null;
            return (
              <span
                key={e.id}
                style={{
                  position: "absolute",
                  left: `${e.left}%`,
                  top: `${e.top}%`,
                  fontSize: `${e.size}px`,
                  opacity: 0.2 + Math.random() * 0.25,
                  transform: `rotate(${e.rotate}deg)`,
                  pointerEvents: "none",
                  transition:
                    "top 0.06s linear, left 0.06s linear, transform 0.06s linear",
                  WebkitTextStroke: "0px transparent",
                  userSelect: "none",
                }}
              >
                {randomEmoji}
              </span>
            );
          })}
        </div>

      {/* HEADER */}
      <header className="flex items-center justify-between px-2 py-2 border-b border-gray-300 dark:border-gray-700 backdrop-blur-sm bg-white/20 dark:bg-black/20 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onBack} className="md:hidden mr-2 text-xl">
            ÔåÉ
          </button>
          <img
            src={conversationAvatar}
            alt="avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="truncate">
            <div className="text-sm font-semibold truncate">
              {conversationName}
            </div>
            <div className="text-xs truncate text-gray-700 dark:text-gray-300 flex items-center gap-1">
              {selectedChat?.isGroup ? (
                `${selectedChat?.participants?.length || 0} membres`
              ) : (
                <span className="flex items-center gap-1">
                  {contactStatus.isOnline && (
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                  )}
                  <span className="text-gray-500 text-xs">{getUserStatusText()}</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Boutons statiques pour appels */}
          <Phone
            size={16}
            className="text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-800 dark:hover:text-gray-100"
            onClick={() => alert("Fonctionnalit├® d'appel vocal bient├┤t disponible!")}
          />
          <Video
            size={16}
            className="text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-800 dark:hover:text-gray-100"
            onClick={() => alert("Fonctionnalit├® d'appel vid├®o bient├┤t disponible!")}
          />
          
          <button onClick={() => setIsOptionsOpen(true)}>
            <MoreVertical
              size={16}
              className="text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-800 dark:hover:text-gray-100"
            />
          </button>
        </div>
      </header>

      {/* DEMANDE DE MESSAGE */}
      {isIncomingMessageRequest && (
        <MessageRequestBanner
          conversationName={conversationName}
          conversationAvatar={conversationAvatar}
          onAccept={async () => {
            const token = localStorage.getItem("token");
            try {
              console.log('­ƒƒó Acceptation demande pour conversation:', selectedChat._id);
              
              const res = await fetch("http://localhost:5000/api/relations/accept-request", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ conversationId: selectedChat._id }),
              });

              const data = await res.json();
              console.log('Ô£à R├®ponse accept:', data);

              if (res.ok) {
                window.location.reload();
              } else {
                console.error('ÔØî Erreur accept:', data);
                alert(data.error || "Erreur lors de l'acceptation");
              }
            } catch (err) {
              console.error('ÔØî Erreur r├®seau accept:', err);
              alert("Erreur r├®seau");
            }
          }}
          onDelete={async () => {
            if (!confirm("Supprimer cette demande de message ?")) return;

            const token = localStorage.getItem("token");
            try {
              console.log('­ƒö┤ Suppression demande pour conversation:', selectedChat._id);
              
              const res = await fetch("http://localhost:5000/api/relations/delete-request", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ conversationId: selectedChat._id }),
              });

              const data = await res.json();
              console.log('Ô£à R├®ponse delete:', data);

              if (res.ok) {
                onBack();
              } else {
                console.error('ÔØî Erreur delete:', data);
                alert(data.error || "Erreur lors de la suppression");
              }
            } catch (err) {
              console.error('ÔØî Erreur r├®seau delete:', err);
              alert("Erreur r├®seau");
            }
          }}
        />
      )}

      {/* SECTION MESSAGES ├ëPINGL├ëS */}
      {showPinnedSection && pinnedMessages.length > 0 && (
        <div className="border-b border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/40 z-20">
          <div className="flex items-center justify-between px-3 py-1.5">
            <div className="flex items-center gap-1.5">
              <Pin size={14} className="text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
                {pinnedMessages.length} ├®pingl├®{pinnedMessages.length > 1 ? "s" : ""}
              </span>
            </div>
            <button
              onClick={() => setShowPinnedSection(false)}
              className="text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 rounded p-0.5 transition"
            >
              <X size={14} />
            </button>
          </div>

          <div className="max-h-28 overflow-y-auto px-3 pb-2 scrollbar-thin scrollbar-thumb-yellow-500 scrollbar-track-yellow-100 dark:scrollbar-thumb-yellow-300 dark:scrollbar-track-yellow-900/50">
            <div className="space-y-1.5">
              {pinnedMessages.map((msg) => (
                <button
                  key={msg._id}
                  onClick={() => {
                    const element = document.getElementById(`message-${msg._id}`);
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth", block: "center" });
                      element.classList.add("ring-3", "ring-yellow-400");
                      setTimeout(() => element.classList.remove("ring-3", "ring-yellow-400"), 1500);
                    }
                  }}
                  className="w-full text-left bg-white dark:bg-gray-800 rounded shadow-sm hover:shadow transition p-2 text-xs border border-yellow-200 dark:border-yellow-700 block"
                >
                  <div className="line-clamp-1 text-gray-800 dark:text-gray-200 font-medium">
                    {msg.typeMessage === "text" && msg.content}
                    {msg.typeMessage === "image" && "­ƒôÀ Photo"}
                    {msg.typeMessage === "video" && "­ƒÄÑ Vid├®o"}
                    {msg.typeMessage === "audio" && "­ƒÄñ Vocal"}
                    {msg.typeMessage === "file" && `­ƒôÄ ${msg.fileName || "Fichier"}`}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

        {/* THEME SELECTOR */}
        {showThemeSelector && (
          <ThemeSelector
            onSelectTheme={applyTheme}
            onRemoveTheme={removeTheme}
            onClose={() => setShowThemeSelector(false)}
          />
        )}

      {/* MESSAGES */}
      <main
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-2 py-2 space-y-3 relative z-10"
        onClick={(e) => {
          if (
            e.target.closest(".message-menu") ||
            e.target.closest(".reaction-picker")
          ) {
            return;
          }
          setShowMessageMenu(null);
          setShowReactionPicker(null);
        }}
      >

        {/*Modifier pour supprimer  */}
        {messages.map((msg, i) => {
  const showDate =
    i === 0 ||
    messages[i - 1]?.createdAt?.split("T")[0] !== msg.createdAt?.split("T")[0];

  const isDeletedByMe = deletedMessages.includes(msg._id);
  const isDeletedForEveryone = deletedForEveryone.includes(msg._id);

  // D├®terminer si le message ├®tait "de moi" avant suppression
  // (on utilise la logique d├®j├á existante dans MessageBubble)
  const currentUserId = user?._id || user?.id || user?.userId;
  const rawSender = msg.senderId || msg.sender || msg.Id_sender || msg.Id_User || msg.userId;
  const messageSenderId = typeof rawSender === "object" && rawSender?._id ? rawSender._id : rawSender;
  const wasFromMe = currentUserId && messageSenderId && String(currentUserId) === String(messageSenderId);

  // Si supprim├® ÔåÆ placeholder avec alignement correct
  if (isDeletedByMe || isDeletedForEveryone) {
    return (
      <div key={msg._id}>
        {showDate && (
          <div className="text-center text-[10px] text-gray-700 dark:text-gray-400 my-2">
            <span className="bg-myYellow2 px-5 py-2 dark:bg-myYellow rounded-lg">
              {formatDateLabel(msg.createdAt, t)}
            </span>
          </div>
        )}
        <div className={`flex ${wasFromMe ? "justify-end" : "justify-start"}`}>
          <div
            className={`
              max-w-[85%] px-4 py-3 rounded-lg text-sm italic text-gray-500 dark:text-gray-400
              ${wasFromMe 
                ? "bg-myYellow2 dark:bg-mydarkYellow/30 rounded-t-lg rounded-bl-lg rounded-br-none" 
                : "bg-myGray4 dark:bg-[#2E2F2F] rounded-t-lg rounded-br-lg rounded-bl-none"}
            `}
          >
            Vous avez supprim├® un message
          </div>
        </div>
      </div>
    );
  }

  // Message normal (non supprim├®)
  return (
    <div key={msg._id}>
      {showDate && (
        <div className="text-center text-[10px] text-gray-700 dark:text-gray-400 my-2">
          <span className="bg-myYellow2 px-5 py-2 dark:bg-myYellow rounded-lg">
            {formatDateLabel(msg.createdAt, t)}
          </span>
        </div>
      )}
      <MessageBubble
        msg={msg}
        index={i}
        deletedMessages={deletedMessages}
        setDeletedMessages={setDeletedMessages}
      />
    </div>
  );
})}

        {/* ­ƒöÑ INDICATEUR "EN TRAIN D'├ëCRIRE" */}
        {isTyping && typingUsers.length > 0 && (
          <TypingIndicator 
            avatar={otherUserAvatar}
            username={selectedChat?.isGroup ? typingUsers[0]?.username : null}
          />
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* INPUT */}



<footer className="px-2 py-2 backdrop-blur-sm bg-white/20 dark:bg-black/20 z-20">
  {/* Ô£à SI BLOQU├ë PAR MOI */}
  {isBlocked && blockedBy === 'me' ? (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
      <div className="text-center space-y-3">
        <p className="text-sm text-red-800 dark:text-red-200 font-medium">
          {t("chat.youBlocked") || "Vous avez bloqu├®"} {otherUserName || "cet utilisateur"}
        </p>
        <p className="text-xs text-red-600 dark:text-red-300">
          {t("chat.blockMessage") || "Vous ne pouvez pas contacter cette personne ou l'appeler dans cette discussion. Vous ne recevez pas ses messages ou appels."}
        </p>
        <button
          onClick={() => setIsConfirmUnblockModalOpen(true)}
          className="px-4 py-2 bg-myYellow hover:bg-yellow-400 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {t("chat.unblock") || "D├®bloquer"}
        </button>
      </div>
    </div>
  ) : isBlocked && blockedBy === 'them' ? (
    /* Ô£à SI BLOQU├ë PAR EUX */
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        {t("chat.blockedByOther") || "Vous ne pouvez pas envoyer de message ├á cette personne"}
      </p>    
    </div>
  ) : (
    /* Ô£à SINON : INPUT NORMAL */
    <>
      {isRecording && (
        <div className="mb-2 flex items-center justify-center gap-2 text-red-500">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">
            {Math.floor(recordingTime / 60)}:
            {(recordingTime % 60).toString().padStart(2, "0")}
          </span>
          <button onClick={cancelRecording} className="ml-4 text-xs underline">
            Annuler
          </button>
        </div>
      )}

      {selectedFile && (
        <div className="mb-2 p-2 border rounded bg-white dark:bg-neutral-800">
          {selectedFile.type.startsWith("image/") && (
            <img src={filePreview} className="max-h-40 rounded" alt="preview" />
          )}

          {selectedFile.type.startsWith("video/") && (
            <video src={filePreview} controls className="max-h-40 rounded" />
          )}

          {!selectedFile.type.startsWith("image/") &&
           !selectedFile.type.startsWith("video/") && (
            <p className="text-sm">­ƒôÄ {selectedFile.name}</p>
          )}

          <button
            onClick={() => {
              setSelectedFile(null);
              setFilePreview(null);
            }}
            className="text-xs text-red-500 underline mt-1"
          >
            Annuler
          </button>
        </div>
      )}

      {/* ­ƒÄ¿ EMOJI PICKER */}
      <div className="relative">
        {showEmojiPicker && (
          <div className="absolute bottom-16 left-0 z-50">
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
              searchDisabled={false}
              skinTonesDisabled={false}
              height={400}
              width={320}
            />
          </div>
        )}

        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 flex items-center gap-2 px-4 py-4 rounded-xl bg-myGray4 dark:bg-[#2E2F2F] backdrop-blur-md">
            {/* ­ƒÄ¿ BOUTON EMOJI */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              type="button"
            >
              <Smile
                size={18}
                className={`cursor-pointer transition-colors ${
                  showEmojiPicker 
                    ? 'text-myYellow' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              />
            </button>

            <Paperclip
              size={18}
              className="text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,video/*,application/*"
            />
            <input
              type="text"
              className="flex items-center flex-1 bg-transparent outline-none text-xs text-myBlack dark:text-white"
              placeholder={t("chat.inputPlaceholder") || "Tapez un message..."}
              value={inputText}
              onChange={handleInputChange}
              onKeyPress={(e) =>
                e.key === "Enter" && !isRecording && handleSendMessage()
              }
              disabled={isRecording}
            />
          </div>

          <button
            className="w-12 h-12 flex items-center justify-center rounded-xl text-sm font-bold text-myBlack bg-myYellow2 dark:bg-mydarkYellow"
            onClick={
              selectedFile
                ? handleSendMessage
                : inputText.trim() === ""
                ? handleMicClick
                : handleSendMessage
            }
          >
            {selectedFile || inputText.trim() !== "" ? (
              <Send size={18} />
            ) : (
              <Mic
                size={18}
                className={`text-gray-700 dark:myBlack ${
                  isRecording ? "animate-pulse text-red-500" : ""
                }`}
              />
            )}
          </button>
        </div>
      </div>
    </>
  )}
</footer>

     

      {/* Search Modal */}
      {openSearch && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpenSearch(false)}
          ></div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 right-6 w-[300px] bg-white dark:bg-gray-700 rounded-lg shadow-lg p-3 z-50"
          >
            <input
              type="text"
              placeholder={t("chat.searchPlaceholder") || "Rechercher..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 text-xs text-myBlack dark:text-white bg-transparent"
            />
          </motion.div>
        </>
      )}

      {/* Confirm Unblock Modal */}
      <ConfirmBlockModal
        isOpen={isConfirmUnblockModalOpen}
        onClose={() => setIsConfirmUnblockModalOpen(false)}
        onConfirm={async () => {
          setIsConfirmUnblockModalOpen(false);
          await unblock();
        }}
        actionType="unblock"
        userInfo={{
          name: otherUserName,
          avatar: conversationAvatar
        }}
      />

      {/* Forward Modal */}
      <ForwardModal
        isOpen={showForwardModal}
        onClose={() => {
          setShowForwardModal(false);
          setMessageToForward(null);
        }}
        message={messageToForward}
        conversations={myConversations}
        currentConversationId={selectedChat?._id}
        onForward={(targetConversationId) => {
          forwardMessage(messageToForward?._id, targetConversationId);
        }}
      />
      {showDeleteModal && (
  <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
    <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 dark:border-neutral-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Supprimer le message
        </h3>
      </div>

      {/* Corps */}
      <div className="px-6 py-6 space-y-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Que voulez-vous faire ?
        </p>

        <div className="space-y-3">
          {/* Supprimer pour moi */}
          <button
            onClick={() => {
              handleDeleteForMe(messageToDelete);
              setShowDeleteModal(false);
            }}
            className="w-full px-4 py-3 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition"
          >
            <div className="font-medium">Supprimer pour moi</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Vous ne verrez plus ce message, mais les autres le verront toujours.
            </div>
          </button>

          {/* Supprimer pour tout le monde */}
          <button
            onClick={async () => {
              await handleDeleteForEveryone(messageToDelete);
              setShowDeleteModal(false);
            }}
            className="w-full px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
          >
            <div className="font-medium">Supprimer pour tout le monde</div>
            <div className="text-xs text-red-500/80 dark:text-red-400/80">
              Ce message sera supprim├® pour vous et les autres participants.
            </div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-700 flex justify-end gap-3">
        <button
          onClick={() => setShowDeleteModal(false)}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition"
        >
          Annuler
        </button>
      </div>
    </div>
  </Modal>
)}
       {isOptionsOpen && (
  <>
    <div
      className="fixed inset-0 bg-black/30 z-30"
      onClick={() => setIsOptionsOpen(false)}
    ></div>
    <ChatOptionsMenu
      selectedChat={{
        ...selectedChat,
        //  AJOUTER le userId de l'autre utilisateur
        userId: selectedChat?.isGroup 
          ? null // Pas de blocage pour les groupes
          : selectedChat?.participants?.find(
              participant => {
                const participantId = participant._id || participant.id;
                const currentUserId = user?._id || user?.id || user?.userId;
                return String(participantId) !== String(currentUserId);
              }
            )?._id,
        openInfo: () => setIsInfoOpen(true),
        openTheme: () => {
          setShowThemeSelector(true);
          setIsOptionsOpen(false);
        },
      }}
      onClose={() => setIsOptionsOpen(false)}
      onOpenSearch={() => setOpenSearch(true)}
      // Ô£à Ajouter le callback pour refresh
      onBlockStatusChange={() => refresh()}
    />
  </>
)}
        {isInfoOpen && (

  <InfoContactModal
    chat={{
      ...selectedChat,
      openTheme: () => setShowThemeSelector(true),
      onArchive: async () => {
        try {
          if (isArchived) {
            await unarchiveConversation(selectedChat._id);
          } else {
            await archiveConversation(selectedChat._id);
          }
        } catch (err) {
          alert("Erreur lors de l'op├®ration");
        }
      },
      isArchived: isArchived,
    }}
    onClose={() => setIsInfoOpen(false)}
      onBlockStatusChange={() => refresh()}
  />
)}

    </div>
  );
}
