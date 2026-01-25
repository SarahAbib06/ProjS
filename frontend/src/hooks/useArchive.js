// frontend/src/hooks/useArchive.js
import { useState, useCallback } from 'react';
import { conversationService } from '../services/conversationService';
import socketService from '../services/socketService';

export const useArchive = () => {
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les conversations archivées
  const loadArchivedConversations = useCallback(async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      
      const response = await conversationService.getArchivedConversations(userId);
      
      console.log('📁 Conversations archivées chargées:', response);
      
      setArchivedConversations(response.conversations || []);
    } catch (err) {
      console.error('❌ Erreur chargement archivées:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Archiver une conversation
  const archiveConversation = useCallback(async (conversationId) => {
    try {
      await conversationService.archiveConversation(conversationId);
      socketService.archiveConversation(conversationId);
      
      console.log('📁 Conversation archivée');
    } catch (err) {
      console.error('❌ Erreur archivage:', err);
      throw err;
    }
  }, []);

  // Désarchiver une conversation
  const unarchiveConversation = useCallback(async (conversationId) => {
    try {
      await conversationService.unarchiveConversation(conversationId);
      socketService.unarchiveConversation(conversationId);
      
      // Retirer de la liste locale
      setArchivedConversations(prev => 
        prev.filter(conv => conv._id !== conversationId)
      );
      
      console.log('📂 Conversation désarchivée');
    } catch (err) {
      console.error('❌ Erreur désarchivage:', err);
      throw err;
    }
  }, []);

  // Écouter les événements d'archivage via Socket.IO
  useEffect(() => {
    const handleArchived = (data) => {
      console.log('📁 Conversation archivée (Socket):', data);
      if (data.success) {
        loadArchivedConversations();
      }
    };

    socketService.onConversationArchived(handleArchived);

    return () => {
      socketService.off('conversation_archived', handleArchived);
    };
  }, [loadArchivedConversations]);

  return {
    archivedConversations,
    loading,
    loadArchivedConversations,
    archiveConversation,
    unarchiveConversation
  };
};