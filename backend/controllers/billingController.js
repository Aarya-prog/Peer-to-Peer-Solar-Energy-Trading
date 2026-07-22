import crypto from 'crypto';
import Bill from '../models/Bill.js';
import Payment from '../models/Payment.js';
import Profile from '../models/Profile.js';
import Notification from '../models/Notification.js';
import AutoPaySettings from '../models/AutoPaySettings.js';
import Project from '../models/Project.js';
import Investment from '../models/Investment.js';
import InvestorAgreement from '../models/InvestorAgreement.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import asyncHandler from '../utils/asyncHandler.js';

// Simulated Dummy Bank Payment Gateway Card Switch
const validateDummyBankCard = (card) => {
  if (!card) {
    return { success: false, error: 'Dummy Bank: Card details are required for card checkouts.' }
  }

  const { number, name, expiry, cvv } = card;

  if (!name || name.trim().length < 3) {
    return { success: false, error: 'Dummy Bank: Invalid Cardholder Name.' };
  }

  const cleanNumber = (number || '').replace(/\s+/g, '');
  if (!/^\d{16}$/.test(cleanNumber)) {
    return { success: false, error: 'Dummy Bank: Invalid Card Number. Must be a 16-digit number.' };
  }

  if (cleanNumber.includes('9999')) {
    return { success: false, error: 'Dummy Bank: Transaction Declined. Card has insufficient funds (Test Trigger).' };
  }
  if (cleanNumber.includes('0000')) {
    return { success: false, error: 'Dummy Bank: Transaction Declined. Card is reported lost or stolen (Test Trigger).' };
  }

  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    return { success: false, error: 'Dummy Bank: Invalid Expiry Date format. Use MM/YY.' };
  }

  const [monthStr, yearStr] = expiry.split('/');
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10) + 2000;

  if (month < 1 || month > 12) {
    return { success: false, error: 'Dummy Bank: Invalid Expiry Month.' };
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { success: false, error: 'Dummy Bank: Card has expired.' };
  }

  if (!/^\d{3}$/.test(cvv)) {
    return { success: false, error: 'Dummy Bank: Invalid CVV. Must be a 3-digit code.' };
  }

  if (cvv === '000') {
    return { success: false, error: 'Dummy Bank: Transaction Declined. Incorrect CVV code (Test Trigger).' };
  }

  return { success: true };
};

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
        { description: `Grid Electricity Consumption (${bill.unitsConsumed} kWh @ ₹${bill.ratePerUnit}/kWh)`, amount: bill.unitsConsumed * bill.ratePerUnit },
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

  const normalizedAmount = Number(amount);
  const checkoutId = `PAY-${crypto.randomUUID()}`;
  const secretKey = process.env.SOLARPAY_SECRET_KEY || 'solarpay_secure_gateway_private_hmac_secret_key';

  // Cryptographically sign the checkout parameters to verify integrity on callback
  const signPayload = `${checkoutId}|${normalizedAmount}|${referenceId}|${req.user.id}`;
  const signature = crypto.createHmac('sha256', secretKey).update(signPayload).digest('hex');

  // Create payment record
  const payment = await Payment.create({
    user: req.user.id,
    amount: normalizedAmount,
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
      signature,
    },
  });
});

// @desc    Cryptographically verify payment signature and complete payout
// @route   POST /api/payments/verify-signature
// @access  Private
export const verifyPaymentSignature = asyncHandler(async (req, res) => {
  const { checkoutId, signature, paymentMethod, cardDetails } = req.body;

  if (!checkoutId || !signature) {
    return res.status(400).json({ success: false, error: 'Please provide checkoutId and signature' });
  }

  const payment = await Payment.findOne({ checkoutId });
  if (!payment) {
    return res.status(404).json({ success: false, error: 'Transaction checkout ID not found' });
  }

  if (payment.status === 'Success') {
    return res.status(200).json({
      success: true,
      message: 'Cryptographic checkout signature verified. Payout completed.',
      data: {
        transactionId: payment.checkoutId,
        amount: payment.amount,
        status: payment.status,
      },
    });
  }

  const secretKey = process.env.SOLARPAY_SECRET_KEY || 'solarpay_secure_gateway_private_hmac_secret_key';

  // Rebuild verification hash
  const signPayload = `${checkoutId}|${Number(payment.amount)}|${payment.referenceId}|${req.user.id}`;
  const localSignature = crypto.createHmac('sha256', secretKey).update(signPayload).digest('hex');

  if (localSignature !== signature) {
    console.error('verify-signature error: cryptographic signature mismatch', { localSignature, signature });
    payment.status = 'Failed';
    await payment.save();
    return res.status(400).json({ success: false, error: 'Cryptographic checkout signature verification failed. Payout aborted.' });
  }

  // If payment method is Card, validate card details through Dummy Bank
  const resolvedMethod = paymentMethod && paymentMethod.toLowerCase().includes('wallet') ? 'Wallet' :
                         paymentMethod && paymentMethod.toLowerCase().includes('card') ? 'Card' :
                         paymentMethod && paymentMethod.toLowerCase().includes('upi') ? 'UPI' : 'Other';
  
  if (resolvedMethod === 'Card') {
    const bankAuth = validateDummyBankCard(cardDetails);
    if (!bankAuth.success) {
      console.error('verify-signature error: bank auth failed', bankAuth.error);
      payment.status = 'Failed';
      await payment.save();
      return res.status(400).json({ success: false, error: bankAuth.error });
    }
  }

  if (resolvedMethod === 'UPI') {
    const { upiId } = req.body;
    if (!upiId || !upiId.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please provide a valid UPI ID (e.g., username@bank)' });
    }
  }

  const profile = await Profile.findOne({ user: req.user.id });
  if (!profile) {
    return res.status(404).json({ success: false, error: 'User profile not found.' });
  }

  if (paymentMethod && paymentMethod.toLowerCase().includes('wallet')) {
    if (profile.balance < payment.amount) {
      console.error('verify-signature error: insufficient wallet balance', { balance: profile.balance, amount: payment.amount });
      payment.status = 'Failed';
      await payment.save();
      return res.status(400).json({ success: false, error: `Insufficient wallet balance. Available: ₹${profile.balance.toLocaleString('en-IN')}, Required: ₹${payment.amount.toLocaleString('en-IN')}` });
    }
    profile.balance -= payment.amount;
  }

  payment.status = 'Success';
  if (paymentMethod) {
    if (paymentMethod.toLowerCase().includes('wallet')) {
      payment.method = 'Wallet';
    } else if (paymentMethod.toLowerCase().includes('upi')) {
      payment.method = 'UPI';
    } else {
      payment.method = 'Card';
    }
  }
  await payment.save();

  // Finalize depending on checkout type
  if (payment.type === 'Bill') {
    const bill = await Bill.findById(payment.referenceId);
    if (bill) {
      bill.status = 'Paid';
      bill.paymentReference = payment.checkoutId;
      await bill.save();

      // Add paid bill amount to Admin wallet balance
      const adminUser = await User.findOne({ role: 'Admin' });
      if (adminUser) {
        const adminProfile = await Profile.findOne({ user: adminUser._id });
        if (adminProfile) {
          adminProfile.balance += payment.amount;
          await adminProfile.save();
        }
      }
    }
  } else if (payment.type === 'Deposit') {
    if (profile) {
      profile.balance += payment.amount;
    }
  } else if (payment.type === 'Investment') {
    const { legalNameSignature, agreementAccepted, durationMonths } = req.body;
    const project = await Project.findById(payment.referenceId);
    if (project) {
      const lockMonths = parseInt(durationMonths) || 12;
      const roiMap = { 1: 6, 6: 8, 12: 10, 36: 12, 60: 15 };
      const expectedROI = roiMap[lockMonths] || 10;
      const maturityDate = new Date();
      maturityDate.setMonth(maturityDate.getMonth() + lockMonths);

      // Check if an investment was already created for this user/project/amount recently (within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      let investment = await Investment.findOne({
        user: req.user.id,
        project: project._id,
        amount: payment.amount,
        createdAt: { $gte: fiveMinutesAgo }
      });

      if (!investment) {
        investment = await Investment.create({
          user: req.user.id,
          project: project._id,
          amount: payment.amount,
          roi: expectedROI,
          durationMonths: lockMonths,
          startDate: new Date(),
          maturityDate: maturityDate,
          status: 'Locked',
          payoutFrequency: lockMonths >= 12 ? 'Yearly' : 'Monthly',
        });
      }

      let agreement = await InvestorAgreement.findOne({
        user: req.user.id,
        project: project._id,
        investmentAmount: payment.amount,
        createdAt: { $gte: fiveMinutesAgo }
      });

      if (!agreement) {
        const agreementText = `This legal agreement is entered into on ${new Date().toLocaleDateString()} between the investor ${legalNameSignature || 'Verified Investor'} and Solar Trade Company. The investor agrees to invest ₹${payment.amount.toLocaleString()} into Project: ${project.name} (${project.location}) for a locked duration of ${lockMonths} Months with expected ROI of ${expectedROI}%. Returns are estimated and not guaranteed. Funds are locked until Maturity: ${maturityDate.toLocaleDateString()}.`;

        agreement = await InvestorAgreement.create({
          user: req.user.id,
          project: project._id,
          investmentAmount: payment.amount,
          expectedROI: expectedROI,
          planDuration: lockMonths,
          legalNameSignature: legalNameSignature || 'Verified Investor',
          agreementText: agreementText,
        });
      }

      // Link agreement to investment if not already linked
      if (investment && !investment.agreement) {
        investment.agreement = agreement._id;
        await investment.save();
      }

      // Add invested amount to Admin wallet balance
      const adminUser = await User.findOne({ role: 'Admin' });
      if (adminUser) {
        const adminProfile = await Profile.findOne({ user: adminUser._id });
        if (adminProfile) {
          adminProfile.balance += payment.amount;
          await adminProfile.save();
        }
      }

      project.fundedAmount += payment.amount;
      if (project.fundedAmount >= (project.maximumCapacity || project.targetFunding)) {
        project.status = 'Operational';
      }
      await project.save();

      if (profile) {
        if (!profile.badges.includes('Green Investor')) {
          profile.badges.push('Green Investor');
        }
      }
    }
  }

  // Award points to user profile (except for wallet deposits)
  if (profile) {
    if (payment.type === 'Investment') {
      profile.rewardPoints += Math.floor(payment.amount * 0.10); // 10% reward points for investment
    } else if (payment.type !== 'Deposit') {
      profile.rewardPoints += Math.floor(payment.amount * 0.05); // 5% rewards points on payment
    }
    await profile.save();
  }

  // Send system notifications
  if (payment.type === 'Deposit') {
    await Notification.create({
      user: req.user.id,
      title: 'Wallet Balance Deposited',
      message: `₹${payment.amount.toLocaleString('en-IN')} has been successfully credited to your account.`,
      type: 'Success',
    });
  } else {
    await Notification.create({
      user: req.user.id,
      title: 'Payment Received!',
      message: `Your payment of ₹${payment.amount.toFixed(2)} via SolarPay was secure and successful. (Ref: ${payment.checkoutId})`,
      type: 'Success',
    });
  }

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
  const profile = await Profile.findOne({ user: req.user.id });
  const subscription = await Subscription.findOne({ user: req.user.id, status: 'Active' }).populate('plan');
  
  let ratePerUnit = 8.0; // standard default INR rate
  let planName = 'Standard Default';
  
  if (subscription && subscription.plan) {
    ratePerUnit = subscription.plan.ratePerUnit;
    planName = subscription.plan.name;
  }
  
  // Mock smart meter consumption between 120 and 320 kWh
  const unitsConsumed = Math.floor(Math.random() * (320 - 120 + 1)) + 120;
  const fixedCharges = 150.0; // base service fee in INR
  const totalAmount = fixedCharges + (unitsConsumed * ratePerUnit);
  
  // Check if Auto-Pay is enabled and within limits
  const autopay = await AutoPaySettings.findOne({ user: req.user.id });
  let billStatus = 'Unpaid';
  let paymentReference = '';
  
  if (autopay && autopay.enabled && totalAmount <= autopay.maxBillLimit) {
    billStatus = 'Paid';
    paymentReference = `PAY-AUTO-${crypto.randomUUID()}`;
  }

  const bill = await Bill.create({
    user: req.user.id,
    unitsConsumed,
    ratePerUnit,
    fixedCharges,
    totalAmount,
    billDate: new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    status: billStatus,
    paymentReference: paymentReference || undefined,
  });

  if (billStatus === 'Paid') {
    // Generate completed payment history record
    await Payment.create({
      user: req.user.id,
      amount: totalAmount,
      type: 'Bill',
      checkoutId: paymentReference,
      signature: 'AutoPay_Verified_Transaction',
      referenceId: bill._id,
      status: 'Success',
      method: (autopay.paymentMethod && autopay.paymentMethod.toLowerCase().includes('wallet')) ? 'Wallet' : 'Card',
    });

    // Add points to profile
    if (profile) {
      profile.rewardPoints += Math.floor(totalAmount * 0.05);
      await profile.save();
    }

    // Success notification
    await Notification.create({
      user: req.user.id,
      title: 'Auto Pay Success!',
      message: `Your monthly statement of ₹${totalAmount.toFixed(2)} was paid automatically using your saved ${autopay.paymentMethod}.`,
      type: 'Success',
    });
  } else {
    // Standard invoice notification
    await Notification.create({
      user: req.user.id,
      title: 'New Solar Invoice Generated',
      message: `Your monthly statement for plan "${planName}" has been generated. Total due: ₹${totalAmount.toFixed(2)}`,
      type: 'Info',
    });
  }
  
  res.status(201).json({ success: true, data: bill });
});

// @desc    Get Auto Pay configuration settings
// @route   GET /api/billing/autopay/settings
// @access  Private
export const getAutoPaySettings = asyncHandler(async (req, res) => {
  let settings = await AutoPaySettings.findOne({ user: req.user.id });
  if (!settings) {
    settings = await AutoPaySettings.create({ user: req.user.id });
  }
  res.status(200).json({ success: true, data: settings });
});

// @desc    Update Auto Pay configuration settings
// @route   PUT /api/billing/autopay/settings
// @access  Private
export const updateAutoPaySettings = asyncHandler(async (req, res) => {
  let settings = await AutoPaySettings.findOne({ user: req.user.id });
  if (!settings) {
    settings = await AutoPaySettings.create({ user: req.user.id });
  }

  const { enabled, paymentMethod, billingDate, maxBillLimit, paymentReminder } = req.body;

  if (enabled !== undefined) settings.enabled = enabled;
  if (paymentMethod !== undefined) settings.paymentMethod = paymentMethod;
  if (billingDate !== undefined) settings.billingDate = billingDate;
  if (maxBillLimit !== undefined) settings.maxBillLimit = maxBillLimit;
  if (paymentReminder !== undefined) settings.paymentReminder = paymentReminder;

  await settings.save();

  // Send settings notification
  await Notification.create({
    user: req.user.id,
    title: 'Auto Pay Settings Updated',
    message: `Auto Pay settings have been successfully updated. Status: ${settings.enabled ? 'Enabled' : 'Disabled'}.`,
    type: 'Info',
  });

  res.status(200).json({ success: true, data: settings });
});
