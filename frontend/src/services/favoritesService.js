import axios from "axios";

const API_URL = "http://localhost:5000/api/favorites";

// Ajouter une conversation aux favoris
export const addFavorite = (userId, conversationId) => {
  return axios.post(`${API_URL}/add`, {
    userId,
    conversationId
  });
};

// Supprimer une conversation des favoris
export const removeFavorite = (userId, conversationId) => {
  return axios.post(`${API_URL}/remove`, {
    userId,
    conversationId
  });
};

// Récupérer toutes les conversations favorites
export const getFavorites = (userId) => {
  return axios.get(`${API_URL}?userId=${userId}`);
};