import MaintenanceRequest from '../models/MaintenanceRequest.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Submit maintenance request
// @route   POST /api/maintenance/request
// @access  Private
export const requestMaintenance = asyncHandler(async (req, res) => {
  const { installationId, description } = req.body;

  if (!description) {
    return res.status(400).json({ success: false, error: 'Please provide a description' });
  }

  const maintenance = await MaintenanceRequest.create({
    customer: req.user.id,
    installation: installationId || null,
    description,
  });

  // Notify admin
  await Notification.create({
    user: null,
    title: 'New Maintenance Request',
    message: `User ${req.user.name} submitted a maintenance request: "${description.substring(0, 50)}..."`,
    type: 'Warning',
  });

  res.status(201).json({ success: true, data: maintenance });
});

// @desc    Get user's maintenance requests
// @route   GET /api/maintenance/my-requests
// @access  Private
export const getMyMaintenanceRequests = asyncHandler(async (req, res) => {
  const requests = await MaintenanceRequest.find({ customer: req.user.id }).populate('engineer', 'name email');
  res.status(200).json({ success: true, data: requests });
});

// @desc    Get all maintenance requests (Admin only)
// @route   GET /api/maintenance/all
// @access  Private/Admin
export const getAllMaintenanceRequests = asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.role === 'Engineer') {
    query = { engineer: req.user.id };
  }
  const requests = await MaintenanceRequest.find(query).populate('customer', 'name email').populate('engineer', 'name email');
  res.status(200).json({ success: true, data: requests });
});

// @desc    Update maintenance request status/engineer assignment
// @route   PUT /api/maintenance/:id/update
// @access  Private
export const updateMaintenanceRequest = asyncHandler(async (req, res) => {
  const { status, engineerId, scheduledDate, serviceReport } = req.body;

  let request = await MaintenanceRequest.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ success: false, error: 'Maintenance request not found' });
  }

  // Auth check: Admin, or the assigned engineer
  if (req.user.role !== 'Admin' && request.engineer && request.engineer.toString() !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Not authorized to modify this maintenance request' });
  }

  if (status) request.status = status;
  if (engineerId) request.engineer = engineerId;
  if (scheduledDate) request.scheduledDate = scheduledDate;
  if (serviceReport) request.serviceReport = serviceReport;

  await request.save();

  // Notify customer
  await Notification.create({
    user: request.customer,
    title: `Maintenance Request Update: ${status}`,
    message: `Your maintenance request status has been updated to: ${status}.`,
    type: 'Info',
  });

  res.status(200).json({ success: true, data: request });
});
