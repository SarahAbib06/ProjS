// frontend/src/services/userService.js
import api from './api';

export const userService = {
  // Rechercher des utilisateurs
  searchUsers: async (query) => {
    const response = await api.get('/users/search', {
      params: { q: query }
    });
    return response.data;
  },

  // Récupérer le profil d'un utilisateur
  getUserProfile: async (userId) => {
    const response = await api.get(`/search-relations/search/users/${userId}`);
    return response.data;
  },

  // Mettre à jour les préférences de notifications
  updateNotificationPreferences: async (pushEnabled) => {
    const response = await api.put('/users/notification-preferences', {
      pushEnabled
    });
    return response.data;
  },

  // Récupérer les préférences de notifications
  getNotificationPreferences: async () => {
    const response = await api.get('/users/notification-preferences');
    return response.data;
  },

  // Upload photo de profil
  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('profile', file);

    const response = await api.post('/upload/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Supprimer photo de profil
  deleteProfilePicture: async () => {
    const response = await api.delete('/upload/profile');
    return response.data;
  }
};