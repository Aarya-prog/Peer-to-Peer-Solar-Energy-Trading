import Profile from '../models/Profile.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ user: req.user.id }).populate('user', 'name email role isVerified');
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }
  res.status(200).json({ success: true, data: profile });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { phone, street, city, state, zip, preferences, governmentIdType, governmentIdNumber, verifiedLocation, customerType } = req.body;

  let profile = await Profile.findOne({ user: req.user.id });
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  // Update fields
  if (phone !== undefined) profile.phone = phone;
  if (street !== undefined) profile.address.street = street;
  if (city !== undefined) profile.address.city = city;
  if (state !== undefined) profile.address.state = state;
  if (zip !== undefined) profile.address.zip = zip;
  if (preferences !== undefined) profile.preferences = { ...profile.preferences, ...preferences };
  if (customerType !== undefined) profile.customerType = customerType;
  
  if (governmentIdType !== undefined) {
    profile.governmentIdType = governmentIdType;
    profile.verificationStatus = 'Pending';
  }
  if (governmentIdNumber !== undefined) {
    profile.governmentIdNumber = governmentIdNumber;
    profile.verificationStatus = 'Pending';
  }
  if (verifiedLocation !== undefined) {
    profile.verifiedLocation = verifiedLocation;
  }

  await profile.save();

  res.status(200).json({ success: true, data: profile });
});

// @desc    Upload profile picture
// @route   POST /api/users/profile/photo
// @access  Private
export const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Please upload a photo file' });
  }

  const profile = await Profile.findOne({ user: req.user.id });
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  // Save filename
  profile.profilePicture = `/uploads/${req.file.filename}`;
  await profile.save();

  res.status(200).json({ success: true, data: profile.profilePicture });
});

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
export const deleteAccount = asyncHandler(async (req, res) => {
  await Profile.deleteOne({ user: req.user.id });
  await User.findByIdAndDelete(req.user.id);

  // Clear cookie
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ success: true, message: 'Account deleted successfully' });
});

// @desc    Get reward details
// @route   GET /api/users/rewards
// @access  Private
export const getRewards = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ user: req.user.id }).select('rewardPoints badges achievements');
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }
  res.status(200).json({ success: true, data: profile });
});

// @desc    Apply referral code
// @route   POST /api/users/referral
// @access  Private
export const applyReferral = asyncHandler(async (req, res) => {
  const { referralCode } = req.body;

  const profile = await Profile.findOne({ user: req.user.id });
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  if (profile.referredBy) {
    return res.status(400).json({ success: false, error: 'Referral code already applied' });
  }

  const referrerProfile = await Profile.findOne({ referralCode });
  if (!referrerProfile) {
    return res.status(404).json({ success: false, error: 'Referral code not found' });
  }

  if (referrerProfile.user.toString() === req.user.id) {
    return res.status(400).json({ success: false, error: 'Cannot apply your own referral code' });
  }

  profile.referredBy = referralCode;
  profile.rewardPoints += 50; // award current user
  referrerProfile.rewardPoints += 100; // award referrer

  await profile.save();
  await referrerProfile.save();

  res.status(200).json({ success: true, message: 'Referral code applied successfully!', rewardPoints: profile.rewardPoints });
});

// @desc    Deposit wallet funds
// @route   POST /api/users/deposit
// @access  Private
export const depositFunds = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const depositAmt = parseFloat(amount);
  if (isNaN(depositAmt) || depositAmt <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid deposit amount' });
  }

  const profile = await Profile.findOne({ user: req.user.id });
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  profile.balance += depositAmt;
  await profile.save();

  // Log simulated payment record
  await Payment.create({
    user: req.user.id,
    amount: depositAmt,
    type: 'Deposit',
    checkoutId: `DEP-${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
    signature: 'SolarPay_Deposit_Verified',
    status: 'Success',
    method: 'Card',
    referenceId: req.user.id,
  });

  // Create user notification
  await Notification.create({
    user: req.user.id,
    title: 'Wallet Balance Deposited',
    message: `₹${depositAmt.toLocaleString('en-IN')} has been successfully credited to your account.`,
    type: 'Success',
  });

  res.status(200).json({ success: true, balance: profile.balance });
});

// @desc    Get consumer wallet and balance history
// @route   GET /api/users/wallet/history
// @access  Private
export const getWalletHistory = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ user: req.user.id });
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  const payments = await Payment.find({ user: req.user.id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      balance: profile.balance,
      rewardPoints: profile.rewardPoints,
      transactions: payments,
    }
  });
});

// @desc    Get consumer metric energy analysis logs
// @route   GET /api/users/metrics/analysis
// @access  Private
export const getCustomerMetrics = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ user: req.user.id });
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  const monthlyLogs = [
    { month: 'Jan', consumptionKwh: 290, solarKwh: 180, utilityKwh: 110, billAmount: 1885 },
    { month: 'Feb', consumptionKwh: 310, solarKwh: 200, utilityKwh: 110, billAmount: 2015 },
    { month: 'Mar', consumptionKwh: 280, solarKwh: 190, utilityKwh: 90,  billAmount: 1820 },
    { month: 'Apr', consumptionKwh: 340, solarKwh: 230, utilityKwh: 110, billAmount: 2210 },
    { month: 'May', consumptionKwh: 320, solarKwh: 210, utilityKwh: 110, billAmount: 2080 },
    { month: 'Jun', consumptionKwh: 380, solarKwh: 250, utilityKwh: 130, billAmount: 2470 },
  ];

  res.status(200).json({
    success: true,
    data: {
      monthlyLogs,
      summary: {
        carbonOffsetKg: 145.8,
        treeEquivalent: 7,
        peakLoadKw: 4.2,
        averageDailyKwh: 11.5,
        solarRatioPercent: 63,
      }
    }
  });
});
