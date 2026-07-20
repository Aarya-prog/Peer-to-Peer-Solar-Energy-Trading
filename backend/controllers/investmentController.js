import Project from '../models/Project.js';
import Investment from '../models/Investment.js';
import Profile from '../models/Profile.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all investment projects
// @route   GET /api/investments/projects
// @access  Private
export const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({});
  res.status(200).json({ success: true, data: projects });
});

// @desc    Create a solar investment project (Admin only)
// @route   POST /api/investments/projects
// @access  Private/Admin
export const createProject = asyncHandler(async (req, res) => {
  const project = await Project.create(req.body);
  res.status(201).json({ success: true, data: project });
});

// @desc    Invest in a project (Simulate Checkout/Wallet purchase)
// @route   POST /api/investments/invest/:projectId
// @access  Private
export const investInProject = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const project = await Project.findById(req.params.projectId);

  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }

  if (project.status !== 'Funding') {
    return res.status(400).json({ success: false, error: 'Project is no longer accepting funding' });
  }

  const investAmount = parseFloat(amount);
  if (isNaN(investAmount) || investAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid investment amount' });
  }

  // Update project funding
  project.fundedAmount += investAmount;
  if (project.fundedAmount >= project.targetFunding) {
    project.status = 'Construction';
  }
  await project.save();

  // Create investment record
  const sharesOwned = Math.floor(investAmount / 100); // assume $100 per share/unit
  const investment = await Investment.create({
    user: req.user.id,
    project: project._id,
    amount: investAmount,
    sharesOwned,
  });

  // Log in profile achievements
  const profile = await Profile.findOne({ user: req.user.id });
  if (profile) {
    profile.rewardPoints += Math.floor(investAmount * 0.1);
    if (!profile.badges.includes('Green Investor')) {
      profile.badges.push('Green Investor');
    }
    await profile.save();
  }

  // Send notification
  await Notification.create({
    user: req.user.id,
    title: 'Investment Successful!',
    message: `You successfully invested $${investAmount.toLocaleString()} in ${project.name}.`,
    type: 'Success',
  });

  res.status(201).json({ success: true, data: investment });
});

// @desc    Get investor portfolio metrics
// @route   GET /api/investments/portfolio
// @access  Private
export const getPortfolio = asyncHandler(async (req, res) => {
  const investments = await Investment.find({ user: req.user.id, status: 'Active' }).populate('project');

  let totalInvested = 0;
  let totalCurrentValue = 0;
  let totalROIRealized = 0;

  const projectBreakdown = investments.map((inv) => {
    const invAmt = inv.amount;
    const roiPercentage = inv.project.expectedROI || 10;
    // Simulate active ROI growth based on operational status
    let growth = 0;
    if (inv.project.status === 'Operational') {
      growth = invAmt * (roiPercentage / 100);
    } else if (inv.project.status === 'Construction') {
      growth = invAmt * (roiPercentage / 200); // partial return
    }

    const currentValue = invAmt + growth;
    totalInvested += invAmt;
    totalCurrentValue += currentValue;
    totalROIRealized += growth;

    return {
      projectName: inv.project.name,
      invested: invAmt,
      currentValue,
      roi: roiPercentage,
      status: inv.project.status,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      totalInvested,
      totalCurrentValue,
      totalROIRealized,
      breakdown: projectBreakdown,
      investmentsList: investments,
    },
  });
});

// @desc    Get all platform investments (Admin)
// @route   GET /api/investments/all
// @access  Private/Admin
export const getAllInvestmentsAdmin = asyncHandler(async (req, res) => {
  const investments = await Investment.find({}).populate('user', 'name email').populate('project', 'name expectedROI status');
  res.status(200).json({ success: true, data: investments });
});

// @desc    Simulate withdrawal request
// @route   POST /api/investments/withdraw
// @access  Private
export const requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const withdrawAmount = parseFloat(amount);
  if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid withdrawal amount' });
  }

  // Create global/admin notice for simulated manual approval
  await Notification.create({
    user: null, // admin review
    title: 'Withdrawal Request Sim',
    message: `User ${req.user.name} requested a wallet payout of $${withdrawAmount.toFixed(2)}.`,
    type: 'Warning',
  });

  res.status(200).json({
    success: true,
    message: `Withdrawal request of $${withdrawAmount.toFixed(2)} submitted for approval (simulation).`,
  });
});
