import express from 'express';
import {
  getMyBills,
  getInvoiceDetails,
  createPaymentIntent,
  verifyPaymentSignature,
  generateMockBill,
} from '../controllers/billingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Billing endpoints
router.get('/my-bills', getMyBills);
router.post('/mock-invoice', generateMockBill);
router.get('/invoice/:billId/download', getInvoiceDetails);

// SolarPay secure gateway endpoints
router.post('/payments/create-intent', createPaymentIntent);
router.post('/payments/verify-signature', verifyPaymentSignature);

export default router;
