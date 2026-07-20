import express from 'express';
import {
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  subscribeToPlan,
  getActiveSubscription,
  cancelSubscription,
} from '../controllers/planController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Plan public routes
router.get('/', getPlans);
router.get('/:id', getPlan);

// Admin-only plan editing
router.post('/', protect, authorize('Admin'), createPlan);
router.put('/:id', protect, authorize('Admin'), updatePlan);
router.delete('/:id', protect, authorize('Admin'), deletePlan);

// Subscription routes (protected)
router.post('/subscribe', protect, subscribeToPlan);
router.get('/active/current', protect, getActiveSubscription);
router.put('/cancel/current', protect, cancelSubscription);

export default router;
