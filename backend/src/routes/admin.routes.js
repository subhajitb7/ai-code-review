import express from 'express';
import {
  getAllUsers, deleteUser, updateUserRole,
  getAllReviews, deleteReview, getAdminStats,
  getSystemSettings, updateSystemSettings, toggleUserSuspension,
  getAuditLogs
} from '../controllers/admin.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/stats', protect, adminOnly, getAdminStats);
router.get('/users', protect, adminOnly, getAllUsers);
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.put('/users/:id/role', protect, adminOnly, updateUserRole);
router.put('/users/:id/suspend', protect, adminOnly, toggleUserSuspension);
router.get('/reviews', protect, adminOnly, getAllReviews);
router.delete('/reviews/:id', protect, adminOnly, deleteReview);
router.get('/settings', protect, adminOnly, getSystemSettings);
router.put('/settings', protect, adminOnly, updateSystemSettings);
router.get('/audit-logs', protect, adminOnly, getAuditLogs);

export default router;
