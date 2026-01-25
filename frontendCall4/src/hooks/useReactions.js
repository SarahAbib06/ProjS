// frontend/src/hooks/useReactions.js
import { useState, useEffect, useCallback } from "react";
import { reactionService } from "../services/reactionService";
import socketService from "../services/socketService";

export const useReactions = (messageId) => {
  const [reactions, setReactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Chargement initial des réactions
  const loadReactions = useCallback(async () => {
    if (!messageId) return;

    try {
      setLoading(true);
      const data = await reactionService.getMessageReactions(messageId);
      setReactions(data || []);
    } catch (err) {
      // 404 = pas de réactions, on ne spam pas la console
      if (err.response?.status === 404) {
        setReactions([]);
      } else {
        console.error("❌ Erreur chargement réactions:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [messageId]);

  // Ajouter une réaction (via socket)
  const addReaction = useCallback(
    async (emoji) => {
      if (!messageId) return;

      // Optionnel : reposer sur REST pour avoir le retour complet
      // const { data: reaction } = await reactionService.addReaction(messageId, emoji);
      // setReactions((prev) => [...prev, reaction]);

      socketService.addReaction(messageId, emoji);
    },
    [messageId]
  );

  // Supprimer la réaction de l’utilisateur courant
  const removeReaction = useCallback(async () => {
    if (!messageId) return;
    socketService.removeReaction(messageId);
  }, [messageId]);

  // Temps réel
useEffect(() => {
  if (!messageId) return;

  socketService.joinMessageReactions(messageId);

  const handleAdded = (data) => {
    // data peut venir de 'reaction_added' ou de 'conversation_reaction_update'
    if (data.messageId !== messageId) return;

    const reaction = data.reaction || data; // selon ce que tu renvoies
    setReactions((prev) => [...prev, reaction]);
  };

  const handleRemoved = (data) => {
    if (data.messageId !== messageId) return;
    const reaction = data.reaction || data;

    setReactions((prev) =>
      prev.filter((r) => String(r._id) !== String(reaction._id))
    );
  };

  socketService.onReactionAdded(handleAdded);
  socketService.onReactionRemoved(handleRemoved);

  return () => {
    socketService.leaveMessageReactions(messageId);
    socketService.off("reaction_added", handleAdded);
    socketService.off("reaction_removed", handleRemoved);
  };
}, [messageId]);


  useEffect(() => {
    loadReactions();
  }, [loadReactions]);

  return {
    reactions,
    loading,
    addReaction,
    removeReaction,
    refresh: loadReactions,
  };
};
