import express from 'express';
import {
  getMyNotifications,
  markAsRead,
  createAnnouncement,
} from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyNotifications);
router.put('/read/:id', markAsRead);
router.post('/announcement', authorize('Admin'), createAnnouncement);

export default router;
