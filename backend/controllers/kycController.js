import KYC from '../models/KYC.js';
import Notification from '../models/Notification.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Submit KYC details
// @route   POST /api/kyc/submit
// @access  Private (Investor)
export const submitKYC = asyncHandler(async (req, res) => {
  const {
    fullName,
    dob,
    panNumber,
    aadhaarNumber,
    gstNumber,
    bankName,
    accountHolderName,
    accountNumber,
    ifscCode,
    upiId,
    address,
  } = req.body;

  // Find existing KYC record
  let kyc = await KYC.findOne({ user: req.user.id });

  const kycData = {
    user: req.user.id,
    fullName,
    dob,
    panNumber,
    aadhaarNumber,
    gstNumber,
    bankName,
    accountHolderName,
    accountNumber,
    ifscCode,
    upiId,
    address,
    status: 'Pending',
    rejectionReason: '',
  };

  // Add paths for uploaded documents if provided by Multer
  if (req.files) {
    if (req.files.profilePhoto) {
      kycData.profilePhoto = `/uploads/${req.files.profilePhoto[0].filename}`;
    }
    if (req.files.identityProof) {
      kycData.identityProof = `/uploads/${req.files.identityProof[0].filename}`;
    }
    if (req.files.addressProof) {
      kycData.addressProof = `/uploads/${req.files.addressProof[0].filename}`;
    }
  }

  // Fallbacks for simulated uploads
  if (req.body.profilePhoto) kycData.profilePhoto = req.body.profilePhoto;
  if (req.body.identityProof) kycData.identityProof = req.body.identityProof;
  if (req.body.addressProof) kycData.addressProof = req.body.addressProof;

  if (kyc) {
    // Update existing
    kyc = await KYC.findOneAndUpdate({ user: req.user.id }, kycData, { new: true });
  } else {
    // Create new
    kyc = await KYC.create(kycData);
  }

  // Sync with user Profile
  const profile = await Profile.findOne({ user: req.user.id });
  if (profile) {
    profile.verificationStatus = 'Pending';
    await profile.save();
  }

  // Notify Admins
  const adminUser = await User.findOne({ role: 'Admin' });
  if (adminUser) {
    await Notification.create({
      user: adminUser._id,
      title: 'New KYC Request',
      message: `${req.user.role} ${fullName} submitted documents for verification.`,
      type: 'Info',
    });
  }

  res.status(201).json({ success: true, data: kyc });
});

// @desc    Get current investor's KYC status
// @route   GET /api/kyc/status
// @access  Private
export const getKYCStatus = asyncHandler(async (req, res) => {
  const kyc = await KYC.findOne({ user: req.user.id });
  res.status(200).json({ success: true, data: kyc || null });
});

// @desc    Get all KYC requests (Admin only)
// @route   GET /api/kyc/admin/all
// @access  Private/Admin
export const getAllKYCAdmin = asyncHandler(async (req, res) => {
  const requests = await KYC.find({}).populate('user', 'name email');
  res.status(200).json({ success: true, data: requests });
});

// @desc    Approve/Reject KYC request (Admin only)
// @route   PUT /api/kyc/admin/:id/status
// @access  Private/Admin
export const updateKYCStatusAdmin = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  const kyc = await KYC.findById(req.params.id);

  if (!kyc) {
    return res.status(404).json({ success: false, error: 'KYC record not found' });
  }

  kyc.status = status;
  if (rejectionReason) kyc.rejectionReason = rejectionReason;
  await kyc.save();

  // Sync status back to user's profile
  const profile = await Profile.findOne({ user: kyc.user });
  if (profile) {
    // Maps KYC.js verification enum to Profile.js verification status enum
    profile.verificationStatus = status === 'Verified' ? 'Verified' : (status === 'Rejected' ? 'Rejected' : 'Pending');
    if (status === 'Verified') {
      profile.verifiedLocation = kyc.address;
    }
    await profile.save();
  }

  // Send notification to the investor
  await Notification.create({
    user: kyc.user,
    title: status === 'Verified' ? 'KYC Approved!' : 'KYC Rejected',
    message: status === 'Verified' 
      ? 'Congratulations, your identity validation is complete. You can now access investment plans!'
      : `Your KYC profile request was rejected. Reason: ${rejectionReason || 'Documents mismatch'}. Please resubmit correct files.`,
    type: status === 'Verified' ? 'Success' : 'Warning',
  });

  res.status(200).json({ success: true, data: kyc });
});
