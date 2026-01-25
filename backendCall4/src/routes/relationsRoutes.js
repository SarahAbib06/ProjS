
import express from 'express';
import { getContacts } from '../controllers/relationsController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/contacts', authMiddleware, getContacts);

export default router;