// frontend/src/services/reactionService.js
import api from "./api";

export const reactionService = {
  addReaction: async (messageId, emoji) => {
    const res = await api.post("/reactions", { messageId, emoji });
    return res.data; // { success, data: reaction }
  },

  removeReaction: async (messageId) => {
    const res = await api.delete(`/reactions/${messageId}`);
    return res.data;
  },

  // ✅ URL alignée sur router.get("/message/:messageId")
getMessageReactions: async (messageId) => {
  const response = await api.get(`/reactions/message/${messageId}`);
  return response.data;
},

  getAvailableReactions: async () => {
    const res = await api.get("/reactions/available");
    return res.data; // { success, reactions: [...] }
  },
};
