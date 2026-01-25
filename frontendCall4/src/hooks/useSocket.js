// frontend/src/hooks/useSocket.js
import { useEffect, useRef } from 'react';
import socketService from '../services/socketService';

export const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !socketRef.current) {
      socketRef.current = socketService.connect(token);
      
      // Rejoindre les notifications au démarrage
      socketService.joinNotifications();
    }

    return () => {
      // On ne déconnecte PAS ici pour garder la connexion active
      // La déconnexion se fera lors du logout
    };
  }, []);

  return socketRef.current;
};
