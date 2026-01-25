// frontend/src/hooks/useTyping.js
import { useState, useEffect, useCallback, useRef } from 'react';
import socketService from '../services/socketService';

export const useTyping = (conversationId) => {
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  // Envoyer le statut "en train d'écrire"
  const sendTyping = useCallback(() => {
    if (conversationId) {
      socketService.sendTyping(conversationId, true);
      
      // Réinitialiser le timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Arrêter après 3 secondes d'inactivité
      typingTimeoutRef.current = setTimeout(() => {
        socketService.sendTyping(conversationId, false);
      }, 3000);
    }
  }, [conversationId]);

  // Écouter les utilisateurs qui écrivent
  useEffect(() => {
    if (!conversationId) return;

    const handleUserTyping = (data) => {
      console.log('⌨️ Utilisateur en train d\'écrire:', data);
      
      if (data.conversationId === conversationId && data.isTyping) {
        setTypingUsers(prev => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });

        // Retirer l'utilisateur après 3 secondes
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }, 3000);
      } else if (!data.isTyping) {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    };

    socketService.onUserTyping(handleUserTyping);

    return () => {
      socketService.off('user_typing', handleUserTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId]);

  return {
    typingUsers,
    sendTyping,
    isTyping: typingUsers.length > 0
  };
};