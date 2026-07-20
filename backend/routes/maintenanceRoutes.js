import express from 'express';
import {
  requestMaintenance,
  getMyMaintenanceRequests,
  getAllMaintenanceRequests,
  updateMaintenanceRequest,
} from '../controllers/maintenanceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/request', requestMaintenance);
router.get('/my-requests', getMyMaintenanceRequests);
router.get('/all', authorize('Admin', 'Engineer'), getAllMaintenanceRequests);
router.put('/:id/update', updateMaintenanceRequest);

export default router;
