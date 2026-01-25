// frontend/src/hooks/usePresence.js
import { useState, useEffect, useCallback, useRef } from 'react';
import socketService from '../services/socketService';

export const usePresence = () => {
  const [userPresence, setUserPresence] = useState(new Map());
  const heartbeatIntervalRef = useRef(null);

  // Mettre à jour le statut d'un utilisateur
  const updateUserPresence = useCallback((userId, status, lastSeen = null) => {
    setUserPresence(prev => {
      const newMap = new Map(prev);
      newMap.set(userId, {
        status,
        lastSeen: lastSeen || new Date()
      });
      return newMap;
    });
  }, []);

  // Changer son propre statut
  const changeMyStatus = useCallback((status) => {
    socketService.changeStatus(status);
    console.log('📊 Statut changé:', status);
  }, []);

  // Démarrer le heartbeat
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Envoyer un heartbeat toutes les 30 secondes
    heartbeatIntervalRef.current = setInterval(() => {
      socketService.sendHeartbeat();
    }, 30000);

    console.log('💓 Heartbeat démarré');
  }, []);

  // Arrêter le heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
      console.log('💔 Heartbeat arrêté');
    }
  }, []);

  // Obtenir le statut d'un utilisateur
  const getUserStatus = useCallback((userId) => {
    return userPresence.get(userId) || { status: 'offline', lastSeen: null };
  }, [userPresence]);

  // Écouter les changements de présence
  useEffect(() => {
    const handlePresenceChanged = (data) => {
      console.log('📊 Présence changée:', data);
      updateUserPresence(data.userId, data.status, data.lastSeen);
    };

    socketService.onUserPresenceChanged(handlePresenceChanged);

    // Démarrer le heartbeat
    startHeartbeat();

    return () => {
      socketService.off('user_presence_changed', handlePresenceChanged);
      stopHeartbeat();
    };
  }, [updateUserPresence, startHeartbeat, stopHeartbeat]);

  return {
    userPresence,
    getUserStatus,
    changeMyStatus,
    updateUserPresence
  };
};