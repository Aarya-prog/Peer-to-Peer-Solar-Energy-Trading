import express from 'express';
import {
  getProjects,
  createProject,
  investInProject,
  getPortfolio,
  getAllInvestmentsAdmin,
  requestWithdrawal,
  getWithdrawalsAdmin,
  approveWithdrawalAdmin,
  simulateROIPayouts,
} from '../controllers/investmentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/projects', getProjects);
router.post('/projects', authorize('Admin'), createProject);
router.post('/invest/:projectId', investInProject);
router.get('/portfolio', getPortfolio);
router.get('/all', authorize('Admin'), getAllInvestmentsAdmin);
router.post('/withdraw/:investmentId', requestWithdrawal);
router.post('/simulate-payouts', simulateROIPayouts);

// Admin Payout Management
router.get('/admin/withdrawals', authorize('Admin'), getWithdrawalsAdmin);
router.put('/admin/withdrawals/:id/approve', authorize('Admin'), approveWithdrawalAdmin);

export default router;
