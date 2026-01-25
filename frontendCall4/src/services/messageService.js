// frontend/src/services/messageService.js
import api from './api';

export const messageService = {
  // Récupérer les messages d'une conversation
  getMessages: async (conversationId, page = 1, limit = 50) => {
    const response = await api.get(`/messages/${conversationId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Envoyer un message texte
  sendTextMessage: async (conversationId, content, Id_receiver = null) => {
    const response = await api.post('/messages', {
      conversationId,
      content,
      typeMessage: 'text',
      Id_receiver
    });
    return response.data;
  },

  // Envoyer une image
  sendImageMessage: async (conversationId, file, Id_receiver = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    if (Id_receiver) formData.append('Id_receiver', Id_receiver);

    const response = await api.post('/messages/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Envoyer une vidéo
  sendVideoMessage: async (conversationId, file, Id_receiver = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    if (Id_receiver) formData.append('Id_receiver', Id_receiver);

    const response = await api.post('/messages/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Envoyer un fichier
  sendFileMessage: async (conversationId, file, Id_receiver = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    if (Id_receiver) formData.append('Id_receiver', Id_receiver);

    const response = await api.post('/messages/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Récupérer les médias d'une conversation (images, vidéos, fichiers)
  getConversationMedia: async (conversationId, page = 1, limit = 50) => {
    const response = await api.get(`/messages/${conversationId}/media`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Récupérer les messages épinglés
  getPinnedMessages: async (conversationId) => {
    const response = await api.get(`/messages/${conversationId}/pinned`);
    return response.data;
  },

  // Épingler un message
  pinMessage: async (messageId) => {
    const response = await api.post(`/messages/${messageId}/pin`);
    return response.data;
  },

  // Désépingler un message
  unpinMessage: async (messageId) => {
    const response = await api.post(`/messages/${messageId}/unpin`);
  },

  // Transférer un message
  forwardMessage: async (messageId, targetConversationId) => {
    const response = await api.post(`/messages/${messageId}/forward`, {
      targetConversationId
    });
    return response.data;
  }
};