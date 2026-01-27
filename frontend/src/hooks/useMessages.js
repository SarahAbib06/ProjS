// frontend/src/hooks/useMessages.js
import { useState, useEffect, useCallback, useRef } from "react";
import { messageService } from "../services/messageService";
import socketService from "../services/socketService";

export const useMessages = (conversationId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const isLoadingRef = useRef(false);

  // ✅ Normaliser un message pour être sûr d'avoir createdAt
const normalizeMessage = (message) => {
  const baseDate = message.createdAt || message.timestamp || new Date();
  const d = new Date(baseDate);
  const safeDate = isNaN(d.getTime()) ? new Date() : d;

  return {
    ...message,
    createdAt: safeDate.toISOString(),
  };
};


  // Charger les messages (API)
  const loadMessages = useCallback(
    async (pageNum = 1, append = false) => {
      if (!conversationId || isLoadingRef.current) return;

      try {
        isLoadingRef.current = true;
        setLoading(true);

        console.log(`📜 Chargement messages - Page ${pageNum}`);

        const response = await messageService.getMessages(
          conversationId,
          pageNum
        );

        let newMessages = (response.messages || []).map(normalizeMessage);

        // Tri local ascendant
        newMessages = newMessages.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        if (append) {
          setMessages((prev) => {
            const merged = [...newMessages, ...prev];
            return merged.sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
          });
        } else {
          setMessages(newMessages);
        }

        setHasMore(response.hasMore || false);
        setError(null);
        console.log(`✅ ${newMessages.length} messages chargés`);
      } catch (err) {
        console.error("❌ Erreur chargement messages:", err);
        setError(err.message);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    },
    [conversationId]
  );

  // Envoyer un message texte
      const sendMessage = useCallback(
    async (input) => {
      if (!conversationId) return;

      let content = "";
      let Id_receiver = null;

      // Cas 1 : on reçoit une string (ancienne façon)
      if (typeof input === "string") {
        content = input.trim();
        if (!content) return;
      }
      // Cas 2 : on reçoit un objet (nouvelle façon avec Id_receiver)
      else if (typeof input === "object" && input !== null) {
        content = input.content?.trim();
        Id_receiver = input.Id_receiver;
        if (!content) return;
      } else {
        return;
      }

      try {
        console.log("📨 Envoi message:", { content, Id_receiver, conversationId });

        socketService.sendMessage({
          conversationId,
          content,
          typeMessage: "text",
          Id_receiver, // ← ENVOYÉ AU BACKEND
        });
      } catch (err) {
        console.error("❌ Erreur envoi message:", err);
        throw err;
      }
    },
    [conversationId]
  );

  // Envoyer une image
  const sendImage = useCallback(
    async (file) => {
      if (!conversationId || !file) return;

      try {
        console.log("🖼️ Envoi image:", file.name);

        const reader = new FileReader();
        reader.onload = () => {
          socketService.sendImageMessage({
            conversationId,
            file: reader.result,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          });
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("❌ Erreur envoi image:", err);
        throw err;
      }
    },
    [conversationId]
  );

  // Envoyer une vidéo
  const sendVideo = useCallback(
    async (file) => {
      if (!conversationId || !file) return;

      try {
        console.log("🎥 Envoi vidéo:", file.name);

        const arrayBuffer = await file.arrayBuffer();

        socketService.sendVideoMessage({
          conversationId,
          file: arrayBuffer,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });
      } catch (err) {
        console.error("❌ Erreur envoi vidéo:", err);
        throw err;
      }
    },
    [conversationId]
  );

  // Envoyer un fichier
  const sendFile = useCallback(
    async (file) => {
      if (!conversationId || !file) return;

      try {
        console.log("📎 Envoi fichier:", file.name);

        const reader = new FileReader();
        reader.onload = () => {
          socketService.sendFileMessage({
            conversationId,
            file: reader.result,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            originalName: file.name,
          });
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("❌ Erreur envoi fichier:", err);
        throw err;
      }
    },
    [conversationId]
  );

  // Charger plus (pagination)
  const loadMore = useCallback(() => {
    if (!loading && hasMore && !isLoadingRef.current) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadMessages(nextPage, true);
    }
  }, [loading, hasMore, page, loadMessages]);

  // Epingler / désépingler un message (le serveur décide)
  const pinMessage = useCallback(async (messageId) => {
    try {
      await messageService.pinMessage(messageId);
      console.log("📌 Requête épinglage envoyée:", messageId);
      // L’UI sera mise à jour via 'message:pinned' / 'message:unpinned'
    } catch (err) {
      console.error("❌ Erreur épinglage:", err);
      throw err;
    }
  }, []);

    // Désépingler un message
  const unpinMessage = useCallback(async (messageId) => {
    try {
      await messageService.unpinMessage(messageId);
      console.log("📌 Requête désépinglage envoyée:", messageId);
      // L’UI sera mise à jour via socket 'message:unpinned'
    } catch (err) {
      console.error("❌ Erreur désépinglage:", err);
      throw err;
    }
  }, []);

  // Supprimer un message
  const deleteMessage = useCallback(async (messageId) => {
    try {
      await messageService.deleteMessage(messageId);
      console.log("🗑️ Message supprimé (requête):", messageId);

      // Optimistic update
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch (err) {
      console.error("❌ Erreur suppression message:", err);
      throw err;
    }
  }, []);

  // Transférer un message
  const forwardMessage = useCallback(async (messageId, targetConversationId) => {
    try {
      socketService.forwardMessage(messageId, targetConversationId);
      console.log("📨 Message transféré");
    } catch (err) {
      console.error("❌ Erreur transfert:", err);
      throw err;
    }
  }, []);

  // Rejoindre / quitter la conversation
  useEffect(() => {
    if (conversationId) {
      socketService.joinConversation(conversationId);
      console.log("📱 Rejoint conversation:", conversationId);

      return () => {
        socketService.leaveConversation(conversationId);
        console.log("📱 Quitté conversation:", conversationId);
      };
    }
  }, [conversationId]);

  // Listeners Socket.io
  useEffect(() => {
    if (!conversationId) return;

    const handleNewMessage = (message) => {
      console.log("📨 Nouveau message reçu:", message);

      if (message.conversationId === conversationId) {
        const normalized = normalizeMessage(message);

        setMessages((prev) => {
          if (prev.some((m) => m._id === normalized._id)) {
            return prev;
          }
          const merged = [...prev, normalized];
          return merged.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
        });
      }
    };

    const handleMessageSent = (response) => {
      console.log("✅ Message envoyé confirmé:", response);

      if (response.success && response.data) {
        const normalized = normalizeMessage(response.data);

        setMessages((prev) => {
          if (prev.some((m) => m._id === normalized._id)) {
            return prev;
          }
          const merged = [...prev, normalized];
          return merged.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
        });
      }
    };

    const handleMessageError = (err) => {
      console.error("❌ Erreur message:", err);
      setError(err.error || "Erreur envoi message");
    };

    const handleMessagePinned = (data) => {
      console.log("📌 Message épinglé:", data);

      if (data.messageId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId ? { ...msg, isPinned: true } : msg
          )
        );
      }
    };

    const handleMessageUnpinned = (data) => {
      console.log("📌 Message désépinglé:", data);

      if (data.messageId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId ? { ...msg, isPinned: false } : msg
          )
        );
      }
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageSent(handleMessageSent);
    socketService.onMessageError(handleMessageError);
    socketService.onMessagePinned(handleMessagePinned);
    socketService.onMessageUnpinned(handleMessageUnpinned);

    return () => {
      socketService.off("new_message", handleNewMessage);
      socketService.off("message_sent", handleMessageSent);
      socketService.off("message_error", handleMessageError);
      socketService.off("message:pinned", handleMessagePinned);
      socketService.off("message:unpinned", handleMessageUnpinned);
    };
  }, [conversationId]);

  // Chargement initial
  useEffect(() => {
    if (conversationId) {
      setMessages([]);
      setPage(1);
      loadMessages(1);
    }
  }, [conversationId, loadMessages]);

  return {
    messages,
    loading,
    error,
    hasMore,
    sendMessage,
    sendImage,
    sendVideo,
    sendFile,
    loadMore,
    pinMessage,
    unpinMessage,
    deleteMessage,
    forwardMessage,
    refresh: () => loadMessages(1),
  };
};
