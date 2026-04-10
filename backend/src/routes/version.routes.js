import express from 'express';
import { updateFileContent, getFileById, getFileHistory, restoreFileVersion } from '../controllers/version.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:id', protect, getFileById);
router.put('/:id', protect, updateFileContent);
router.post('/:id/restore', protect, restoreFileVersion);
router.get('/:id/history', protect, getFileHistory);

export default router;
