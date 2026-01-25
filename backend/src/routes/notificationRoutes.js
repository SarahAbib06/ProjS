// src/routes/notificationRoutes.js
import express from 'express';
import { pushNotificationService } from '../services/pushNotificationService.js';
import PushToken from '../models/PushToken.js';

const router = express.Router();

// 🆕 ENREGISTRER UN DEVICE PUSH
router.post('/register-device', async (req, res) => {
  try {
    const { userId, token, platform } = req.body;
    
    if (!userId || !token || !platform) {
      return res.status(400).json({
        success: false,
        error: 'userId, token et platform requis'
      });
    }

    const result = await pushNotificationService.registerDevice(userId, token, platform);
    
    res.json({
      success: result,
      message: result ? `Device ${platform} enregistré` : 'Erreur enregistrement'
    });
    
  } catch (error) {
    console.error('❌ Erreur enregistrement device:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🆕 DÉSACTIVER UN DEVICE (quand user se déconnecte)
router.post('/unregister-device', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'token requis'
      });
    }

    await PushToken.findOneAndUpdate(
      { token },
      { isActive: false }
    );

    console.log(`✅ Device désactivé: ${token}`);
    
    res.json({
      success: true,
      message: 'Device désactivé'
    });
    
  } catch (error) {
    console.error('❌ Erreur désactivation device:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🆕 LISTER LES DEVICES D'UN USER (pour debug)
router.get('/user-devices/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const devices = await PushToken.find({ 
      userId, 
      isActive: true 
    });

    res.json({
      success: true,
      devices: devices.map(d => ({
        platform: d.platform,
        createdAt: d.createdAt
      }))
    });
    
  } catch (error) {
    console.error('❌ Erreur liste devices:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;