import socketService from '../services/socketService';

class SocketHelper {
  // Attendre que le socket soit connecté
  static async waitForConnection(maxWait = 5000) {
    return new Promise((resolve, reject) => {
      if (socketService.socket?.connected) {
        console.log('✅ Socket déjà connecté');
        return resolve(true);
      }

      console.log('⏳ Attente connexion socket...');
      
      let timeoutId;
      let connectListener;
      let errorListener;

      // Timeout
      timeoutId = setTimeout(() => {
        if (connectListener) socketService.socket?.off('connect', connectListener);
        if (errorListener) socketService.socket?.off('connect_error', errorListener);
        reject(new Error('Timeout connexion socket'));
      }, maxWait);

      // Écouter la connexion
      connectListener = () => {
        clearTimeout(timeoutId);
        socketService.socket?.off('connect_error', errorListener);
        console.log('✅ Socket connecté après attente');
        resolve(true);
      };

      // Écouter les erreurs
      errorListener = (error) => {
        clearTimeout(timeoutId);
        socketService.socket?.off('connect', connectListener);
        reject(new Error(`Erreur connexion: ${error.message}`));
      };

      // Attacher les listeners
      if (socketService.socket) {
        socketService.socket.once('connect', connectListener);
        socketService.socket.once('connect_error', errorListener);
      } else {
        reject(new Error('Socket non initialisé'));
      }
    });
  }

  // Vérifier et garantir la connexion
  static async ensureConnection() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token manquant');
    }

    // Si pas de socket, le créer
    if (!socketService.socket) {
      console.log('🔌 Création nouveau socket...');
      socketService.connect(token);
      return this.waitForConnection();
    }

    // Si socket existe mais pas connecté
    if (!socketService.socket.connected) {
      console.log('🔌 Socket existe mais pas connecté, attente...');
      return this.waitForConnection();
    }

    return true;
  }

  // Émettre avec garantie de connexion
  static async emitWithConnection(event, data, timeout = 10000) {
    await this.ensureConnection();
    
    return new Promise((resolve, reject) => {
      if (!socketService.socket?.connected) {
        return reject(new Error('Socket non connecté'));
      }

      console.log(`📤 Émission ${event}:`, data);
      
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout emission ${event}`));
      }, timeout);

      socketService.socket.emit(event, data, (response) => {
        clearTimeout(timeoutId);
        resolve(response);
      });
    });
  }
}

export default SocketHelper;