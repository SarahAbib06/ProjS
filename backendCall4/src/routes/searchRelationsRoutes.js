// routes/searchRelationsRoutes.js
import express from 'express';
import {
  searchUsers,
  getUserProfile, 
} from '../controllers/searchRelationsController.js';

// Import du contrôleur QR
import { 
  generateQRCode,
  scanQRCode  // AJOUTEZ CET IMPORT
} from '../controllers/qrController.js';

import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// RECHERCHE 
router.get('/search/users', authMiddleware, searchUsers);
router.get('/search/users/:userId', authMiddleware, getUserProfile);


// ROUTES QR CODE
router.get('/qr/generate', authMiddleware, generateQRCode);

router.post('/qr/scan', authMiddleware, scanQRCode); // NOUVELLE ROUTE POUR SCANNER

export default router;