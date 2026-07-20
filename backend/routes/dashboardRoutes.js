import express from 'express';
import {
  getAdminDashboardStats,
  getAdminUsers,
  getAdminEngineers,
  verifyAdminUser,
} from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/admin', authorize('Admin'), getAdminDashboardStats);
router.get('/admin/users', authorize('Admin'), getAdminUsers);
router.put('/admin/users/:id/verify', authorize('Admin'), verifyAdminUser);
router.get('/admin/engineers', authorize('Admin'), getAdminEngineers);

export default router;
