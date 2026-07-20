import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Project from '../models/Project.js';
import Investment from '../models/Investment.js';
import Bill from '../models/Bill.js';
import EnergyTrade from '../models/EnergyTrade.js';
import Installation from '../models/Installation.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get admin console aggregated stats
// @route   GET /api/dashboard/admin
// @access  Private/Admin
export const getAdminDashboardStats = asyncHandler(async (req, res) => {
  // Counts
  const totalUsers = await User.countDocuments({});
  const totalCustomers = await User.countDocuments({ role: 'Customer' });
  const totalInvestors = await User.countDocuments({ role: 'Investor' });
  const totalEngineers = await User.countDocuments({ role: 'Engineer' });

  // Projects & Investments
  const projectsCount = await Project.countDocuments({});
  const operationalProjects = await Project.find({ status: 'Operational' });
  const energyGenerated = operationalProjects.reduce((sum, p) => sum + (p.energyGeneratedMwh || 0), 0);

  const investments = await Investment.find({ status: 'Active' });
  const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);

  // Revenue (Paid Bills)
  const paidBills = await Bill.find({ status: 'Paid' });
  const billRevenue = paidBills.reduce((sum, b) => sum + b.totalAmount, 0);

  // Completed trades (5% commission revenue)
  const completedTrades = await EnergyTrade.find({ status: 'Completed' });
  const tradeRevenue = completedTrades.reduce((sum, t) => sum + t.totalAmount * 0.05, 0);

  const totalRevenue = billRevenue + tradeRevenue;

  // Recent Activities (e.g. recent 5 installations)
  const recentInstallations = await Installation.find({})
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  // Charts mapping (simulated monthly distributions)
  const revenueChart = [
    { month: 'Jan', revenue: totalRevenue * 0.12 },
    { month: 'Feb', revenue: totalRevenue * 0.14 },
    { month: 'Mar', revenue: totalRevenue * 0.15 },
    { month: 'Apr', revenue: totalRevenue * 0.16 },
    { month: 'May', revenue: totalRevenue * 0.20 },
    { month: 'Jun', revenue: totalRevenue * 0.23 },
  ];

  res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalUsers,
        totalCustomers,
        totalInvestors,
        totalEngineers,
        projectsCount,
        energyGenerated,
        totalInvested,
        totalRevenue,
      },
      recentInstallations,
      revenueChart,
    },
  });
});
export const getAdminUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).lean();
  const data = [];
  for (const user of users) {
    const profile = await Profile.findOne({ user: user._id }).lean() || {};
    data.push({
      ...user,
      id: user._id,
      phone: profile.phone || '',
      address: profile.address || { street: '', city: '', state: '', zip: '' },
      governmentIdType: profile.governmentIdType || 'None',
      governmentIdNumber: profile.governmentIdNumber || '',
      verificationStatus: profile.verificationStatus || 'Pending',
      verifiedLocation: profile.verifiedLocation || '',
    });
  }
  res.status(200).json({ success: true, data });
});

export const getAdminEngineers = asyncHandler(async (req, res) => {
  const engineers = await User.find({ role: 'Engineer' });
  res.status(200).json({ success: true, data: engineers });
});

// @desc    Verify/Reject user profile government details
// @route   PUT /api/dashboard/admin/users/:id/verify
// @access  Private/Admin
export const verifyAdminUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, verifiedLocation } = req.body; // 'Verified' or 'Rejected'

  if (!['Verified', 'Rejected'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid verification status' });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  user.isVerified = status === 'Verified';
  await user.save();

  let profile = await Profile.findOne({ user: id });
  if (!profile) {
    profile = await Profile.create({ user: id });
  }

  profile.verificationStatus = status;
  if (status === 'Verified' && verifiedLocation) {
    profile.verifiedLocation = verifiedLocation;
  }
  await profile.save();

  res.status(200).json({ success: true, message: `User verification status set to ${status}` });
});
