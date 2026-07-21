import Plan from '../models/Plan.js';
import Subscription from '../models/Subscription.js';
import Profile from '../models/Profile.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all plans (Public)
// @route   GET /api/plans
// @access  Public
export const getPlans = asyncHandler(async (req, res) => {
  const { search, limit, page } = req.query;

  const query = { isActive: true };
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const pageNum = parseInt(page || '1', 10);
  const limitNum = parseInt(limit || '10', 10);
  const skip = (pageNum - 1) * limitNum;

  const plans = await Plan.find(query).skip(skip).limit(limitNum);
  const total = await Plan.countDocuments(query);

  res.status(200).json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: plans,
  });
});

// @desc    Get a single plan
// @route   GET /api/plans/:id
// @access  Public
export const getPlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (!plan) {
    return res.status(404).json({ success: false, error: 'Plan not found' });
  }
  res.status(200).json({ success: true, data: plan });
});

// @desc    Create a plan (Admin)
// @route   POST /api/plans
// @access  Private/Admin
export const createPlan = asyncHandler(async (req, res) => {
  const plan = await Plan.create(req.body);
  res.status(201).json({ success: true, data: plan });
});

// @desc    Update a plan (Admin)
// @route   PUT /api/plans/:id
// @access  Private/Admin
export const updatePlan = asyncHandler(async (req, res) => {
  let plan = await Plan.findById(req.params.id);
  if (!plan) {
    return res.status(404).json({ success: false, error: 'Plan not found' });
  }

  plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: plan });
});

// @desc    Delete a plan (Admin)
// @route   DELETE /api/plans/:id
// @access  Private/Admin
export const deletePlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (!plan) {
    return res.status(404).json({ success: false, error: 'Plan not found' });
  }

  await plan.deleteOne();
  res.status(200).json({ success: true, message: 'Plan removed' });
});

// @desc    Subscribe to an energy plan
// @route   POST /api/subscriptions/subscribe
// @access  Private
export const subscribeToPlan = asyncHandler(async (req, res) => {
  if (req.user.role === 'Admin') {
    return res.status(403).json({ success: false, error: 'Admins cannot subscribe to plans' });
  }

  // Enforce KYC verification
  const profile = await Profile.findOne({ user: req.user.id });
  if (!profile || profile.verificationStatus !== 'Verified') {
    return res.status(403).json({ success: false, error: 'KYC verification is required before subscribing to energy plans' });
  }

  const { planId, months } = req.body;

  const plan = await Plan.findById(planId);
  if (!plan || !plan.isActive) {
    return res.status(404).json({ success: false, error: 'Plan not active or not found' });
  }

  // Deactivate any active subscriptions
  await Subscription.updateMany(
    { user: req.user.id, status: 'Active' },
    { status: 'Expired' }
  );

  const durationMonths = parseInt(months || plan.minimumContractMonths || '12', 10);
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + durationMonths);

  const subscription = await Subscription.create({
    user: req.user.id,
    plan: planId,
    endDate,
  });

  // Award points to profile
  if (profile) {
    profile.rewardPoints += 150;
    profile.achievements.push({
      title: 'Power Subscriber',
      description: `Successfully subscribed to energy plan: ${plan.name}`,
    });
    await profile.save();
  }

  res.status(201).json({ success: true, data: subscription });
});

// @desc    Get active subscription
// @route   GET /api/subscriptions/active
// @access  Private
export const getActiveSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ user: req.user.id, status: 'Active' }).populate('plan');
  if (!subscription) {
    return res.status(200).json({ success: true, data: null });
  }
  res.status(200).json({ success: true, data: subscription });
});

// @desc    Cancel active subscription
// @route   PUT /api/subscriptions/cancel
// @access  Private
export const cancelSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ user: req.user.id, status: 'Active' });
  if (!subscription) {
    return res.status(404).json({ success: false, error: 'No active subscription found' });
  }

  subscription.status = 'Cancelled';
  await subscription.save();

  res.status(200).json({ success: true, message: 'Subscription cancelled successfully', data: subscription });
});
