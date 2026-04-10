import express from 'express';
import { getMyAiLogs, getAllAiLogs, getAiStats } from '../controllers/ailog.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', protect, adminOnly, getAllAiLogs);
router.get('/stats', protect, adminOnly, getAiStats);
router.get('/all', protect, adminOnly, getAllAiLogs);

export default router;
