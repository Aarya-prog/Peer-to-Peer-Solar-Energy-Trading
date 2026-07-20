import Installation from '../models/Installation.js';
import Profile from '../models/Profile.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Submit solar installation request
// @route   POST /api/installations/request
// @access  Private
export const requestInstallation = asyncHandler(async (req, res) => {
  const { panelCapacityKw, street, city, state, zip } = req.body;

  if (!panelCapacityKw || !street || !city || !state || !zip) {
    return res.status(400).json({ success: false, error: 'Please provide all details' });
  }

  const installation = await Installation.create({
    user: req.user.id,
    panelCapacityKw,
    address: { street, city, state, zip },
    status: 'Request',
  });

  // Notify admin
  await Notification.create({
    user: null, // Admin/Global notification
    title: 'New Solar Installation Request',
    message: `User ${req.user.name} requested a ${panelCapacityKw}kW panel installation at ${street}, ${city}.`,
    type: 'Info',
  });

  res.status(201).json({ success: true, data: installation });
});

// @desc    Get user's installation requests
// @route   GET /api/installations/my-requests
// @access  Private
export const getMyInstallations = asyncHandler(async (req, res) => {
  const installations = await Installation.find({ user: req.user.id }).populate('engineer', 'name email');
  res.status(200).json({ success: true, data: installations });
});

// @desc    Get all installation requests (Admin)
// @route   GET /api/installations/all
// @access  Private/Admin
export const getAllInstallations = asyncHandler(async (req, res) => {
  const installations = await Installation.find({}).populate('user', 'name email').populate('engineer', 'name email');
  res.status(200).json({ success: true, data: installations });
});

// @desc    Get engineer assigned installations
// @route   GET /api/installations/engineer
// @access  Private
export const getEngineerInstallations = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Engineer' && req.user.role !== 'Admin') {
    return res.status(403).json({ success: false, error: 'Not authorized as engineer' });
  }
  const installations = await Installation.find({ engineer: req.user.id }).populate('user', 'name email');
  res.status(200).json({ success: true, data: installations });
});

// @desc    Update installation workflow status
// @route   PUT /api/installations/:id/status
// @access  Private
export const updateInstallationStatus = asyncHandler(async (req, res) => {
  const { status, engineerId, quoteAmount, inspectionDate, installationDate } = req.body;

  let installation = await Installation.findById(req.params.id);
  if (!installation) {
    return res.status(404).json({ success: false, error: 'Installation not found' });
  }

  // Authorize: Admin or Assigned Engineer
  if (req.user.role !== 'Admin' && installation.engineer && installation.engineer.toString() !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Not authorized to update this installation status' });
  }

  if (status) installation.status = status;
  if (engineerId) installation.engineer = engineerId;
  if (quoteAmount) installation.quoteAmount = quoteAmount;
  if (inspectionDate) installation.inspectionDate = inspectionDate;
  if (installationDate) installation.installationDate = installationDate;

  // If completed, award a badge and reward points to the customer
  if (status === 'Completed') {
    const profile = await Profile.findOne({ user: installation.user });
    if (profile) {
      profile.rewardPoints += 500; // Large reward for deploying solar
      if (!profile.badges.includes('Solar Pro')) {
        profile.badges.push('Solar Pro');
      }
      profile.achievements.push({
        title: 'Solar System Activated',
        description: `Your ${installation.panelCapacityKw}kW panel system has been successfully deployed and activated.`,
      });
      await profile.save();
    }
  }

  await installation.save();

  // Send system notification to user
  await Notification.create({
    user: installation.user,
    title: `Installation Update: ${status}`,
    message: `Your solar installation request status has been updated to ${status}.`,
    type: 'Success',
  });

  res.status(200).json({ success: true, data: installation });
});

// @desc    Update report and upload images for installation
// @route   PUT /api/installations/:id/report
// @access  Private
export const uploadServiceReport = asyncHandler(async (req, res) => {
  const { serviceReport } = req.body;

  let installation = await Installation.findById(req.params.id);
  if (!installation) {
    return res.status(404).json({ success: false, error: 'Installation not found' });
  }

  // Authorize: Admin or Assigned Engineer
  if (req.user.role !== 'Admin' && (!installation.engineer || installation.engineer.toString() !== req.user.id)) {
    return res.status(403).json({ success: false, error: 'Not authorized to update this installation report' });
  }

  if (serviceReport) installation.serviceReport = serviceReport;

  if (req.file) {
    installation.images.push(`/uploads/${req.file.filename}`);
  }

  await installation.save();
  res.status(200).json({ success: true, data: installation });
});
