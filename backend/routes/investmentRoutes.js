import express from 'express';
import {
  getProjects,
  createProject,
  investInProject,
  getPortfolio,
  getAllInvestmentsAdmin,
  requestWithdrawal,
} from '../controllers/investmentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/projects', getProjects);
router.post('/projects', authorize('Admin'), createProject);
router.post('/invest/:projectId', investInProject);
router.get('/portfolio', getPortfolio);
router.get('/all', authorize('Admin'), getAllInvestmentsAdmin);
router.post('/withdraw', requestWithdrawal);

export default router;
