// frontend/src/services/relationService.js
import api from './api';

export const relationService = {

    getBlockedUsers: async () => {
    // ✅ Changé de "/users/blocked" à "/auth/blocked"
    const response = await api.get("/auth/blocked");
    return response.data;
  },
  // Envoyer une invitation
  sendInvitation: async (contactId) => {
    const response = await api.post('/search-relations/relations/invite', {
      contactId
    });
    return response.data;
  },

  // Accepter une invitation
  acceptInvitation: async (relationId) => {
    const response = await api.post('/search-relations/relations/accept', {
      relationId
    });
    return response.data;
  },

  // Annuler une invitation
  cancelInvitation: async (relationId) => {
    const response = await api.delete(`/search-relations/relations/invite/${relationId}`);
    return response.data;
  },

  // Récupérer les invitations en attente
  getPendingInvitations: async () => {
    const response = await api.get('/search-relations/relations/invitations');
    return response.data;
  },

  // Récupérer les contacts
  getContacts: async () => {
    const response = await api.get('/search-relations/relations/contacts');
    return response.data;
  },

  // Supprimer un contact
  removeContact: async (relationId) => {
    const response = await api.delete(`/search-relations/relations/contact/${relationId}`);
    return response.data;
  },

  //bloquer 
  blockUser: async (blockedUserId) => {
    const response = await api.post('/relations/block', {
      blockedUserId
    });
    return response.data;
  },


  // Débloquer un utilisateur

  unblockUser: async (contactId) => {
    // ✅ Changé de "/users/unblock" à "/auth/unblock"
    const response = await api.put(`/auth/unblock/${contactId}`);
    return response.data;
  }
};
