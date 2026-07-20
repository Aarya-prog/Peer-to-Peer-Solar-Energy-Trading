import express from 'express';
import {
  createTicket,
  getTickets,
  replyToTicket,
  submitFeedback,
  getFeedbackAdmin,
} from '../controllers/supportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/tickets', createTicket);
router.get('/tickets', getTickets);
router.post('/tickets/:id/reply', replyToTicket);
router.post('/feedback', submitFeedback);
router.get('/feedback', authorize('Admin'), getFeedbackAdmin);

export default router;
