import { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import socketService from '../services/socketService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // ========================================
  // CHARGER L'UTILISATEUR AU DÉMARRAGE + CONNECTER SOCKET
  // ========================================
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        const token = localStorage.getItem('token');
        
        if (currentUser && token) {
          setUser(currentUser);
          
          // 🔥 CONNECTER SOCKET.IO AUTOMATIQUEMENT
          console.log('🔌 Connexion Socket.IO au démarrage...');
          socketService.connect(token);
          
          // Rejoindre les notifications
          socketService.joinNotifications();
          
          setSocketConnected(true);
          console.log('✅ Socket.IO connecté');
        }
      } catch (err) {
        console.error('❌ Erreur initialisation auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Cleanup à la déconnexion du composant
    return () => {
      // On ne déconnecte pas ici pour garder la connexion active
    };
  }, []);

  // ========================================
  // ÉCOUTER LES CHANGEMENTS DE CONNEXION SOCKET
  // ========================================
  useEffect(() => {
    if (user && socketService.socket) {
      const handleConnect = () => {
        console.log('✅ Socket reconnecté');
        setSocketConnected(true);
        socketService.joinNotifications();
      };

      const handleDisconnect = () => {
        console.log('❌ Socket déconnecté');
        setSocketConnected(false);
      };

      socketService.socket.on('connect', handleConnect);
      socketService.socket.on('disconnect', handleDisconnect);

      return () => {
        if (socketService.socket) {
          socketService.socket.off('connect', handleConnect);
          socketService.socket.off('disconnect', handleDisconnect);
        }
      };
    }
  }, [user]);

  // ========================================
  // INSCRIPTION
  // ========================================
  const register = async (userData) => {
    try {
      setError(null);
      const data = await authService.register(userData);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ========================================
  // VÉRIFIER OTP (INSCRIPTION)
  // ========================================
  const verifyOtp = async (email, otp) => {
    try {
      setError(null);
      const data = await authService.verifyOtp(email, otp);
      
      const userData = {
        id: data.data.user._id || data.data.user.id,
        username: data.data.user.username,
        email: data.data.user.email,
        profilePicture: data.data.user.profilePicture
      };
      
      setUser(userData);
      
      // 🔥 CONNECTER SOCKET.IO APRÈS VÉRIFICATION OTP
      if (data.token) {
        console.log('🔌 Connexion Socket.IO après OTP...');
        socketService.connect(data.token);
        socketService.joinNotifications();
        setSocketConnected(true);
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ========================================
  // RENVOYER OTP
  // ========================================
  const resendOtp = async (email) => {
    try {
      setError(null);
      const data = await authService.resendOtp(email);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ========================================
  // CONNEXION
  // ========================================
  const login = async (credentials) => {
    try {
      setError(null);
      const data = await authService.login(credentials);
      
      // Si connexion réussie avec token (pas d'OTP requis)
      if (data.token) {
        const userData = {
          id: data.id || data.user?.id || data.user?._id,
          username: data.username || data.user?.username,
          email: data.email || data.user?.email,
          profilePicture: data.profilePicture || data.user?.profilePicture
        };
        
        setUser(userData);
        
        // 🔥 SAUVEGARDER USERID POUR LES HOOKS
        localStorage.setItem('userId', userData.id);
        
        // 🔥 CONNECTER SOCKET.IO APRÈS CONNEXION
        console.log('🔌 Connexion Socket.IO après login...');
        socketService.connect(data.token);
        socketService.joinNotifications();
        setSocketConnected(true);
        console.log('✅ Socket.IO connecté');
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ========================================
  // VÉRIFIER OTP INACTIVITÉ
  // ========================================
  const verifyInactivityOtp = async (token, otp) => {
    try {
      setError(null);
      const data = await authService.verifyInactivityOtp(token, otp);
      
      const userData = {
        id: data.id || data.user?.id || data.user?._id,
        username: data.username || data.user?.username,
        email: data.email || data.user?.email,
        profilePicture: data.profilePicture || data.user?.profilePicture
      };
      
      setUser(userData);
      
      // 🔥 RECONNECTER SOCKET.IO
      if (data.token) {
        console.log('🔌 Reconnexion Socket.IO après inactivité...');
        socketService.connect(data.token);
        socketService.joinNotifications();
        setSocketConnected(true);
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ========================================
  // MOT DE PASSE OUBLIÉ
  // ========================================
  const forgotPassword = async (email) => {
    try {
      setError(null);
      const data = await authService.forgotPassword(email);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ========================================
  // RÉINITIALISER LE MOT DE PASSE
  // ========================================
  const resetPassword = async (token, otp, newPassword, newPasswordConfirm) => {
    try {
      setError(null);
      const data = await authService.verifyOtpReset(token, otp, newPassword, newPasswordConfirm);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ========================================
  // DÉCONNEXION
  // ========================================
  const logout = () => {
    console.log('🚪 Déconnexion...');
    
    // Déconnecter Socket.IO
    socketService.disconnect();
    setSocketConnected(false);
    console.log('🔌 Socket.IO déconnecté');
    
    // Nettoyer le localStorage
    authService.logout();
    localStorage.removeItem('userId');
    
    // Réinitialiser l'état
    setUser(null);
    
    console.log('✅ Déconnexion complète');
  };

  const value = {
    user,
    loading,
    error,
    socketConnected,
    socketService, // 🔥 EXPOSER LE SERVICE SOCKET
    register,
    verifyOtp,
    resendOtp,
    login,
    verifyInactivityOtp,
    forgotPassword,
    resetPassword,
    logout,
    isAuthenticated: authService.isAuthenticated()
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};