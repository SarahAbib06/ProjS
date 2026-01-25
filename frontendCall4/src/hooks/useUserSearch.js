// frontend/src/hooks/useUserSearch.js
import { useState, useCallback } from 'react';
import { userService } from '../services/userService';
import { relationService } from '../services/relationService';

export const useUserSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Rechercher des utilisateurs
  const searchUsers = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Recherche utilisateurs:', query);
      
      const response = await userService.searchUsers(query);
      
      setResults(response.users || []);
      
      console.log(`✅ ${response.users?.length || 0} utilisateurs trouvés`);
    } catch (err) {
      console.error('❌ Erreur recherche:', err);
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Envoyer une invitation
  const sendInvitation = useCallback(async (contactId) => {
    try {
      const response = await relationService.sendInvitation(contactId);
      console.log('📨 Invitation envoyée:', response);
      return response;
    } catch (err) {
      console.error('❌ Erreur envoi invitation:', err);
      throw err;
    }
  }, []);

  // Réinitialiser les résultats
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    searchUsers,
    sendInvitation,
    clearResults
  };
};