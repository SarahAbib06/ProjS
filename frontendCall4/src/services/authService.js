// frontend/src/services/authService.js
import api from './api';

export const authService = {
  // ========================================
  // 1. INSCRIPTION
  // ========================================
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de l\'inscription' };
    }
  },

  // ========================================
  // 2. VÉRIFIER OTP (INSCRIPTION)
  // ========================================
  verifyOtp: async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      
      // Stocker le token et l'utilisateur
      if (response.data.data?.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la vérification' };
    }
  },

  // ========================================
  // 3. RENVOYER OTP
  // ========================================
  resendOtp: async (email) => {
    try {
      const response = await api.post('/auth/resend-otp', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors du renvoi de l\'OTP' };
    }
  },

  // ========================================
  // 4. CONNEXION
  // ========================================
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // Si connexion réussie sans OTP
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({
          id: response.data.id,
          username: response.data.username,
          email: response.data.email
        }));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la connexion' };
    }
  },

  // ========================================
  // 5. VÉRIFIER OTP INACTIVITÉ
  // ========================================
  verifyInactivityOtp: async (token, otp) => {
    try {
      const response = await api.post('/auth/verify-inactivity-otp', { token, otp });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({
          id: response.data.id,
          username: response.data.username,
          email: response.data.email
        }));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la vérification' };
    }
  },

  // ========================================
  // 6. MOT DE PASSE OUBLIÉ
  // ========================================
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de l\'envoi de l\'email' };
    }
  },

  // ========================================
  // 7. VÉRIFIER OTP RESET + NOUVEAU MOT DE PASSE
  // ========================================
  verifyOtpReset: async (token, otp, newPassword, newPasswordConfirm) => {
    try {
      const response = await api.post('/auth/verify-otp-reset', {
        token,
        otp,
        newPassword,
        newPasswordConfirm
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la réinitialisation' };
    }
  },

  // ========================================
  // 8. RÉCUPÉRER L'UTILISATEUR CONNECTÉ
  // ========================================
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération du profil' };
    }
  },

  // ========================================
  // 9. DÉCONNEXION
  // ========================================
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // ========================================
  // 10. RÉCUPÉRER L'UTILISATEUR DEPUIS LE LOCALSTORAGE
  // ========================================
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // ========================================
  // 11. VÉRIFIER SI L'UTILISATEUR EST CONNECTÉ
  // ========================================
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};