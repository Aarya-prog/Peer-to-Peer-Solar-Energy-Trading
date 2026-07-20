import crypto from 'crypto';
import Bill from '../models/Bill.js';
import Payment from '../models/Payment.js';
import Profile from '../models/Profile.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get bills for current customer
// @route   GET /api/billing/my-bills
// @access  Private
export const getMyBills = asyncHandler(async (req, res) => {
  const bills = await Bill.find({ user: req.user.id }).sort({ dueDate: -1 });
  res.status(200).json({ success: true, data: bills });
});

// @desc    Get invoice structure for printing/downloading
// @route   GET /api/billing/invoice/:billId/download
// @access  Private
export const getInvoiceDetails = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.billId).populate('user', 'name email');
  if (!bill) {
    return res.status(404).json({ success: false, error: 'Bill not found' });
  }

  if (bill.user._id.toString() !== req.user.id && req.user.role !== 'Admin') {
    return res.status(403).json({ success: false, error: 'Not authorized to view this invoice' });
  }

  res.status(200).json({
    success: true,
    data: {
      invoiceNumber: `INV-${bill._id.toString().substring(18).toUpperCase()}`,
      billDate: bill.billDate,
      dueDate: bill.dueDate,
      customer: {
        name: bill.user.name,
        email: bill.user.email,
      },
      items: [
        { description: 'Base Connection Service Fee', amount: bill.fixedCharges },
        { description: `Grid Electricity Consumption (${bill.unitsConsumed} kWh @ $${bill.ratePerUnit}/kWh)`, amount: bill.unitsConsumed * bill.ratePerUnit },
      ],
      totalAmount: bill.totalAmount,
      status: bill.status,
    },
  });
});

// @desc    Create secure checkout intent (SolarPay Custom Payment Gateway)
// @route   POST /api/payments/create-intent
// @access  Private
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount, type, referenceId } = req.body;

  if (!amount || !type || !referenceId) {
    return res.status(400).json({ success: false, error: 'Please provide amount, transaction type, and referenceId' });
  }

  const checkoutId = `PAY-${crypto.randomUUID()}`;
  const secretKey = process.env.SOLARPAY_SECRET_KEY || 'solarpay_secure_gateway_private_hmac_secret_key';

  // Cryptographically sign the checkout parameters to verify integrity on callback
  const signPayload = `${checkoutId}|${amount}|${referenceId}|${req.user.id}`;
  const signature = crypto.createHmac('sha256', secretKey).update(signPayload).digest('hex');

  // Create payment record
  const payment = await Payment.create({
    user: req.user.id,
    amount,
    type,
    checkoutId,
    signature,
    referenceId,
    status: 'Pending',
  });

  res.status(201).json({
    success: true,
    data: {
      checkoutId,
      amount,
      signature,
      publicKey: 'SP_PUB_KEY_DEMO_2026',
    },
  });
});

// @desc    Verify SolarPay cryptographic transaction signature and finalize payment
// @route   POST /api/payments/verify-signature
// @access  Private
export const verifyPaymentSignature = asyncHandler(async (req, res) => {
  const { checkoutId, signature, paymentMethod } = req.body;

  if (!checkoutId || !signature) {
    return res.status(400).json({ success: false, error: 'Please provide checkoutId and signature' });
  }

  const payment = await Payment.findOne({ checkoutId, user: req.user.id });
  if (!payment) {
    return res.status(404).json({ success: false, error: 'Payment intent record not found' });
  }

  if (payment.status === 'Success') {
    return res.status(400).json({ success: false, error: 'Payment has already been processed' });
  }

  // Cryptographic signature check
  const secretKey = process.env.SOLARPAY_SECRET_KEY || 'solarpay_secure_gateway_private_hmac_secret_key';
  const expectedPayload = `${checkoutId}|${payment.amount}|${payment.referenceId}|${req.user.id}`;
  const expectedSignature = crypto.createHmac('sha256', secretKey).update(expectedPayload).digest('hex');

  if (signature !== expectedSignature) {
    payment.status = 'Failed';
    await payment.save();
    return res.status(400).json({ success: false, error: 'Payment tamper detected! Invalid signature.' });
  }

  // Update payment status
  payment.status = 'Success';
  if (paymentMethod) payment.method = paymentMethod;
  await payment.save();

  // Finalize depending on checkout type
  if (payment.type === 'Bill') {
    const bill = await Bill.findById(payment.referenceId);
    if (bill) {
      bill.status = 'Paid';
      bill.paymentReference = payment.checkoutId;
      await bill.save();
    }
  }

  // Award points to user profile
  const profile = await Profile.findOne({ user: req.user.id });
  if (profile) {
    profile.rewardPoints += Math.floor(payment.amount * 0.05); // 5% rewards points on payment
    await profile.save();
  }

  // Send system notifications
  await Notification.create({
    user: req.user.id,
    title: 'Payment Received!',
    message: `Your payment of $${payment.amount.toFixed(2)} via SolarPay was secure and successful. (Ref: ${payment.checkoutId})`,
    type: 'Success',
  });

  res.status(200).json({
    success: true,
    message: 'Cryptographic checkout signature verified. Payout completed.',
    data: {
      transactionId: payment.checkoutId,
      amount: payment.amount,
      status: payment.status,
    },
  });
});

// @desc    Generate a mock invoice bill (for testing and simulation)
// @route   POST /api/billing/mock-invoice
// @access  Private
export const generateMockBill = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ user: req.user.id }).populate('activePlan');
  
  let ratePerUnit = 8.0; // standard default INR rate
  let planName = 'Standard Default';
  
  if (profile && profile.activePlan) {
    ratePerUnit = profile.activePlan.ratePerUnit;
    planName = profile.activePlan.name;
  }
  
  // Mock smart meter consumption between 120 and 320 kWh
  const unitsConsumed = Math.floor(Math.random() * (320 - 120 + 1)) + 120;
  const fixedCharges = 150.0; // base service fee in INR
  const totalAmount = fixedCharges + (unitsConsumed * ratePerUnit);
  
  const bill = await Bill.create({
    user: req.user.id,
    unitsConsumed,
    ratePerUnit,
    fixedCharges,
    totalAmount,
    billDate: new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    status: 'Unpaid',
  });
  
  await Notification.create({
    user: req.user.id,
    title: 'New Solar Invoice Generated',
    message: `Your monthly statement for plan "${planName}" has been generated. Total due: ₹${totalAmount.toFixed(2)}`,
    type: 'Info',
  });
  
  res.status(201).json({ success: true, data: bill });
});
