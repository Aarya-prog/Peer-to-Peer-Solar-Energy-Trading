import express from 'express';
import {
  listEnergyForSale,
  getActiveListings,
  buyEnergy,
  getMyTrades,
  getAllTradesAdmin,
  buyDirectPlantEnergy,
} from '../controllers/marketplaceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/list', listEnergyForSale);
router.get('/listings', getActiveListings);
router.post('/buy/:id', buyEnergy);
router.post('/buy-direct', buyDirectPlantEnergy);
router.get('/trades', getMyTrades);
router.get('/admin/trades', authorize('Admin'), getAllTradesAdmin);

export default router;
