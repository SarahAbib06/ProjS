// frontend/src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Récupérer les compteurs non lus
  const fetchUnreadCounts = useCallback(() => {
    socketService.getUnreadCounts();
  }, []);

  // Marquer une conversation comme lue
  const markConversationAsRead = useCallback((conversationId) => {
    socketService.markConversationRead(conversationId);
  }, []);

  // Écouter les compteurs non lus
  useEffect(() => {
    const handleUnreadCounts = (data) => {
      console.log('🔢 Compteurs non lus:', data);
      
      if (data.success) {
        setUnreadCount(data.totalUnread || 0);
      }
    };

    const handleNewMessageAlert = (data) => {
      console.log('🔔 Nouvelle notification:', data);
      
      // Ajouter la notification
      setNotifications(prev => [data, ...prev].slice(0, 50)); // Garder les 50 dernières
      
      // Incrémenter le compteur
      setUnreadCount(prev => prev + 1);
    };

    socketService.onUnreadCountsData(handleUnreadCounts);
    socketService.onNewMessageAlert(handleNewMessageAlert);

    // Récupérer les compteurs au montage
    fetchUnreadCounts();

    return () => {
      socketService.off('unread_counts_data', handleUnreadCounts);
      socketService.off('new_message_alert', handleNewMessageAlert);
    };
  }, [fetchUnreadCounts]);

  return {
    unreadCount,
    notifications,
    fetchUnreadCounts,
    markConversationAsRead
  };
};