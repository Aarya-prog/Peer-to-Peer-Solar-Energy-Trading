import express from 'express';
import {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  deleteAccount,
  getRewards,
  applyReferral,
  depositFunds,
  getWalletHistory,
  getCustomerMetrics,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.route('/profile').get(getProfile).put(updateProfile);
router.post('/profile/photo', upload.single('photo'), uploadProfilePhoto);
router.delete('/account', deleteAccount);
router.get('/rewards', getRewards);
router.post('/referral', applyReferral);
router.post('/deposit', depositFunds);
router.get('/wallet/history', getWalletHistory);
router.get('/metrics/analysis', getCustomerMetrics);

export default router;
