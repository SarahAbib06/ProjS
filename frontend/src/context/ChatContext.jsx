// src/context/ChatContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les conversations normales + archivées au démarrage
  useEffect(() => {
    if (!user?._id) return;

    const loadChats = async () => {
      try {
        setLoading(true);

        // Charger les conversations normales (ta route existante)
        const res = await api.get("/conversations"); // ← adapte l'URL si besoin
        setConversations(res.data.conversations || res.data || []);

        // Charger les archivées
        const archivedRes = await api.get(`/archive/user/${user._id}`);
        setArchivedConversations(archivedRes.data.conversations || []);
      } catch (err) {
        console.error("Erreur chargement conversations:", err);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [user]);

  const archiveConversation = async (conversationId) => {
    await api.post(`/archive/${conversationId}/archive`);

    // Retire de la liste principale
    setConversations(prev => prev.filter(c => c._id !== conversationId));

    // Ajoute aux archivées
    const chatToArchive = conversations.find(c => c._id === conversationId);
    if (chatToArchive) {
      setArchivedConversations(prev => [...prev, chatToArchive]);
    }
  };

  const unarchiveConversation = async (conversationId) => {
    await api.post(`/archive/${conversationId}/unarchive`);

    // Retire des archivées
    setArchivedConversations(prev => prev.filter(c => c._id !== conversationId));

    // Remet dans la liste principale
    const chatToUnarchive = archivedConversations.find(c => c._id === conversationId);
    if (chatToUnarchive) {
      setConversations(prev => [...prev, chatToUnarchive]);
    }
  };

  const refreshChats = async () => {
    if (!user?._id) return;
    try {
      const res = await api.get("/conversations");
      setConversations(res.data.conversations || res.data || []);

      const archivedRes = await api.get(`/archive/user/${user._id}`);
      setArchivedConversations(archivedRes.data.conversations || []);
    } catch (err) {
      console.error("Erreur refresh:", err);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        archivedConversations,
        loading,
        archiveConversation,
        unarchiveConversation,
        refreshChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);