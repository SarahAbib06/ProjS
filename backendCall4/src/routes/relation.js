// routes/relation.js
import express from 'express';
import { relationController } from '../controllers/relationController.js';
import  authMiddleware  from '../middleware/auth.js'; // ton middleware d'auth

const router = express.Router();

router.post('/block', authMiddleware, relationController.blockUser);
router.post('/unblock', authMiddleware, relationController.unblockUser);


export default router; 