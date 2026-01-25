// frontend/src/hooks/useContacts.js
import { useState, useEffect, useCallback } from 'react';
import { relationService } from '../services/relationService';

export const useContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les contacts
  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await relationService.getContacts();
      
      console.log('👥 Contacts chargés:', response);
      
      setContacts(response || []);
      setError(null);
    } catch (err) {
      console.error('❌ Erreur chargement contacts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les invitations en attente
  const loadPendingInvitations = useCallback(async () => {
    try {
      const response = await relationService.getPendingInvitations();
      
      console.log('📨 Invitations en attente:', response);
      
      setPendingInvitations(response || []);
    } catch (err) {
      console.error('❌ Erreur chargement invitations:', err);
    }
  }, []);

  // Accepter une invitation
  const acceptInvitation = useCallback(async (relationId) => {
    try {
      await relationService.acceptInvitation(relationId);
      
      // Recharger les contacts et invitations
      await Promise.all([
        loadContacts(),
        loadPendingInvitations()
      ]);
      
      console.log('✅ Invitation acceptée');
    } catch (err) {
      console.error('❌ Erreur acceptation invitation:', err);
      throw err;
    }
  }, [loadContacts, loadPendingInvitations]);

  // Annuler une invitation
  const cancelInvitation = useCallback(async (relationId) => {
    try {
      await relationService.cancelInvitation(relationId);
      
      await loadPendingInvitations();
      
      console.log('✅ Invitation annulée');
    } catch (err) {
      console.error('❌ Erreur annulation invitation:', err);
      throw err;
    }
  }, [loadPendingInvitations]);

  // Supprimer un contact
  const removeContact = useCallback(async (relationId) => {
    try {
      await relationService.removeContact(relationId);
      
      await loadContacts();
      
      console.log('✅ Contact supprimé');
    } catch (err) {
      console.error('❌ Erreur suppression contact:', err);
      throw err;
    }
  }, [loadContacts]);

  // Bloquer un utilisateur
  const blockUser = useCallback(async (userId) => {
    try {
      await relationService.blockUser(userId);
      
      await loadContacts();
      
      console.log('🚫 Utilisateur bloqué');
    } catch (err) {
      console.error('❌ Erreur blocage:', err);
      throw err;
    }
  }, [loadContacts]);

  // Débloquer un utilisateur
  const unblockUser = useCallback(async (userId) => {
    try {
      await relationService.unblockUser(userId);
      
      console.log('✅ Utilisateur débloqué');
    } catch (err) {
      console.error('❌ Erreur déblocage:', err);
      throw err;
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    loadContacts();
    loadPendingInvitations();
  }, [loadContacts, loadPendingInvitations]);

  return {
    contacts,
    pendingInvitations,
    loading,
    error,
    loadContacts,
    loadPendingInvitations,
    acceptInvitation,
    cancelInvitation,
    removeContact,
    blockUser,
    unblockUser
  };
};
