// frontend/src/hooks/useBlockStatus.js
import { useState, useEffect } from 'react';
import { relationService } from '../services/relationService';

export const useBlockStatus = (userId) => {
  const [blockStatus, setBlockStatus] = useState({
    isBlocked: false,
    blockedBy: null,
    loading: true
  });
  
  // ✅ Ajouter un trigger pour forcer le refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!userId) {
      setBlockStatus({ isBlocked: false, blockedBy: null, loading: false });
      return;
    }

    const checkBlockStatus = async () => {
      try {
        const response = await relationService.getBlockedUsers();
        
        let blockedUsers = [];
        if (Array.isArray(response)) {
          blockedUsers = response;
        } else if (response.data) {
          blockedUsers = response.data;
        } else if (response.blocked) {
          blockedUsers = response.blocked;
        } else if (response.blockedUsers) {
          blockedUsers = response.blockedUsers;
        }

        const iBlockedThem = blockedUsers.some(blocked => {
          let blockedId;
          
          if (blocked.contactId) {
            if (typeof blocked.contactId === 'object' && blocked.contactId._id) {
              blockedId = blocked.contactId._id;
            } else {
              blockedId = blocked.contactId;
            }
          } else {
            blockedId = blocked.userId || blocked._id || blocked.id;
          }
          
          return String(blockedId) === String(userId);
        });

        setBlockStatus({
          isBlocked: iBlockedThem,
          blockedBy: iBlockedThem ? 'me' : null,
          loading: false
        });

      } catch (error) {
        console.error('❌ Erreur vérification blocage:', error);
        setBlockStatus({
          isBlocked: false,
          blockedBy: null,
          loading: false
        });
      }
    };

    checkBlockStatus();
  }, [userId, refreshTrigger]); // ✅ Ajouter refreshTrigger aux dépendances

  const unblock = async () => {
    try {
      await relationService.unblockUser(userId);
      
      // ✅ Forcer le refresh du hook
      setRefreshTrigger(prev => prev + 1);
      
      return true;
    } catch (error) {
      console.error('❌ Erreur déblocage:', error);
      return false;
    }
  };
  
  // ✅ Ajouter une fonction refresh manuelle
  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return { ...blockStatus, unblock, refresh };
};