// frontend/src/services/conversationService.js
import api from './api';

export const conversationService = {
  // Récupérer toutes les conversations de l'utilisateur
  getMyConversations: async () => {
    const response = await api.get('/conversations');
    return response.data;
  },

   // Supprimer définitivement une conversation
  deleteConversation: async (conversationId) => {
    const response = await api.delete(`/conversations/${conversationId}`);
    return response.data;
  },

  // Récupérer une conversation spécifique
  getConversation: async (conversationId) => {
    const response = await api.get(`/conversations/${conversationId}`);
    return response.data;
  },

  // Créer un groupe
  createGroup: async (participantIds, groupName) => {
    const response = await api.post('/conversations/groups/create', {
      participantIds,
      groupName
    });
    return response.data;
  },

  // Récupérer les groupes de l'utilisateur
  getMyGroups: async (userId) => {
    const response = await api.get(`/conversations/groups/user/${userId}`);
    return response.data;
  },

  // Marquer une conversation comme lue
  markAsRead: async (conversationId) => {
    const response = await api.post(`/conversations/mark-as-read/${conversationId}`);
    return response.data;
  },

  // Récupérer les compteurs de messages non lus
  getUnreadCounts: async (userId) => {
    const response = await api.get(`/conversations/unread-counts/${userId}`);
    return response.data;
  },

  // Archiver une conversation
  archiveConversation: async (conversationId) => {
    const response = await api.post(`/archive/${conversationId}/archive`);
    return response.data;
  },

  // Désarchiver une conversation
  unarchiveConversation: async (conversationId) => {
    const response = await api.post(`/archive/${conversationId}/unarchive`);
    return response.data;
  },

  // Récupérer les conversations archivées
  getArchivedConversations: async (userId) => {
    const response = await api.get(`/archive/user/${userId}`);
    return response.data;
  },
  // frontend/src/services/conversationService.js

deleteConversationForMe: async (conversationId) => {
  const response = await api.delete(`/conversations/${conversationId}`);
  return response.data;
},

};