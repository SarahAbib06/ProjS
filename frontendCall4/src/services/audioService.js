// frontend/src/services/audioService.js
import api from './api';

export const audioService = {
  // Envoyer un message audio
  sendAudioMessage: async (conversationId, audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-message.webm');
    formData.append('conversationId', conversationId);

    const response = await api.post('/messages/audio/send', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Récupérer les messages audio d'une conversation
  getAudioMessages: async (conversationId) => {
    const response = await api.get(`/messages/audio/${conversationId}`);
    return response.data;
  }
};