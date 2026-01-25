import PushToken from '../models/PushToken.js';
import webPush from 'web-push';

// 🎯 TES VRAIES CLÉS GÉNÉRÉES
const vapidKeys = {
  publicKey: 'BFEOcb1ATAmIevJ7CJM13Xiqqhzll88iKmuKRGPjnJ5M8_6BTDZU8wp6JUKnRNEYsZnUBDuvVoQxCr-kuVIPGbY',
  privateKey: 'DR9KRtbJEScdAwoJhW32K0EwOqOk1EjRWrBpQuc1v9g'
};

// 🎯 CONFIGURATION WEB-PUSH
webPush.setVapidDetails(
  'mailto:test@owly.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export const pushNotificationService = {
  
  // Enregistrer un device
  registerDevice: async (userId, token, platform) => {
    try {
      await PushToken.findOneAndUpdate(
        { token },
        { userId, platform, isActive: true },
        { upsert: true, new: true }
      );
      console.log(`✅ Device ${platform} enregistré pour user ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur enregistrement device:', error);
      return false;
    }
  },

  // Envoyer notification navigateur (PC)
  sendBrowserNotification: async (userId, title, body, data = {}) => {
    try {
      const tokens = await PushToken.find({ 
        userId, 
        platform: 'web',
        isActive: true 
      });
      
      console.log(`📧 Envoi notification à ${tokens.length} devices web`);
      
      for (const tokenDoc of tokens) {
        const payload = JSON.stringify({
          title,
          body,
          icon: '/icon.png',
          data: { ...data, timestamp: new Date() }
        });
        
        try {
          await webPush.sendNotification(tokenDoc.token, payload);
          console.log('✅ Notification navigateur envoyée');
        } catch (error) {
          console.log('❌ Notification échouée:', error.message);
          if (error.statusCode === 410) {
            await PushToken.findByIdAndUpdate(tokenDoc._id, { isActive: false });
          }
        }
      }
      return true;
    } catch (error) {
      console.error('❌ Erreur notifications navigateur:', error);
      return false;
    }
  },

  // Envoyer à tous les devices d'un user
  sendToUser: async (userId, title, body, data = {}) => {
    return await pushNotificationService.sendBrowserNotification(userId, title, body, data);
  }
};