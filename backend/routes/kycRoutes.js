import express from 'express';
import {
  submitKYC,
  getKYCStatus,
  getAllKYCAdmin,
  updateKYCStatusAdmin,
} from '../controllers/kycController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

const uploadFields = upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'identityProof', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
]);

router.post('/submit', uploadFields, submitKYC);
router.get('/status', getKYCStatus);

// Admin-only routing
router.get('/admin/all', authorize('Admin'), getAllKYCAdmin);
router.put('/admin/:id/status', authorize('Admin'), updateKYCStatusAdmin);

export default router;
