import express from 'express';
import {
  requestInstallation,
  getMyInstallations,
  getAllInstallations,
  getEngineerInstallations,
  updateInstallationStatus,
  uploadServiceReport,
} from '../controllers/installationController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.post('/request', requestInstallation);
router.get('/my-requests', getMyInstallations);
router.get('/all', authorize('Admin'), getAllInstallations);
router.get('/engineer', getEngineerInstallations);
router.put('/:id/status', updateInstallationStatus);
router.put('/:id/report', upload.single('photo'), uploadServiceReport);

export default router;
