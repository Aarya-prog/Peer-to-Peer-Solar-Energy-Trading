import Project from '../models/Project.js';
import Investment from '../models/Investment.js';
import Profile from '../models/Profile.js';
import Notification from '../models/Notification.js';
import KYC from '../models/KYC.js';
import InvestorAgreement from '../models/InvestorAgreement.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import User from '../models/User.js';
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
  const { amount, legalNameSignature, agreementAccepted, durationMonths } = req.body;
  
  // 1. Mandatory KYC check
  const kyc = await KYC.findOne({ user: req.user.id });
  if (!kyc || kyc.status !== 'Verified') {
    return res.status(400).json({ success: false, error: 'Mandatory KYC verification is pending. Please complete your profile KYC before investing.' });
  }

  // 2. Validate Project
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

  // 3. Project Funding Limit Validations
  if (investAmount < (project.minimumInvestment || 10000)) {
    return res.status(400).json({ success: false, error: `Minimum investment allowed is ₹${(project.minimumInvestment || 10000).toLocaleString()}` });
  }

  if (investAmount > (project.maximumInvestment || 500000)) {
    return res.status(400).json({ success: false, error: `Maximum investment limit is ₹${(project.maximumInvestment || 500000).toLocaleString()} per transaction.` });
  }

  const remainingCapacity = (project.maximumCapacity || project.targetFunding) - project.fundedAmount;
  if (investAmount > remainingCapacity) {
    return res.status(400).json({ success: false, error: `Investment exceeds remaining project funding capacity of ₹${remainingCapacity.toLocaleString()}` });
  }

  // 4. Agreement Check
  if (!agreementAccepted || !legalNameSignature) {
    return res.status(400).json({ success: false, error: 'You must review and sign the investment agreement before funding.' });
  }

  // 5. Select lock duration and ROI
  const lockMonths = parseInt(durationMonths) || 12;
  const roiMap = { 1: 6, 6: 8, 12: 10, 36: 12, 60: 15 };
  const expectedROI = roiMap[lockMonths] || 10;

  // Calculate maturity
  const maturityDate = new Date();
  maturityDate.setMonth(maturityDate.getMonth() + lockMonths);

  // Check wallet balance
  const profile = await Profile.findOne({ user: req.user.id });
  if (!profile || profile.balance < investAmount) {
    return res.status(400).json({ success: false, error: 'Insufficient wallet balance. Please add funds before purchasing.' });
  }

  // Deduct wallet balance
  profile.balance -= investAmount;
  profile.rewardPoints += Math.floor(investAmount * 0.1);
  if (!profile.badges.includes('Green Investor')) {
    profile.badges.push('Green Investor');
  }
  await profile.save();

  // Add invested amount to Admin wallet balance
  const adminUser = await User.findOne({ role: 'Admin' });
  if (adminUser) {
    const adminProfile = await Profile.findOne({ user: adminUser._id });
    if (adminProfile) {
      adminProfile.balance += investAmount;
      await adminProfile.save();
    }
  }

  // Create Agreement Text
  const agreementText = `This legal agreement is entered into on ${new Date().toLocaleDateString()} between the investor ${legalNameSignature} and Solar Trade Company. The investor agrees to invest ₹${investAmount.toLocaleString()} into Project: ${project.name} (${project.location}) for a locked duration of ${lockMonths} Months with expected ROI of ${expectedROI}%. Returns are estimated and not guaranteed. Funds are locked until Maturity: ${maturityDate.toLocaleDateString()}.`;

  // Create digital agreement
  const agreement = await InvestorAgreement.create({
    user: req.user.id,
    project: project._id,
    investmentAmount: investAmount,
    planDuration: lockMonths,
    expectedROI,
    legalNameSignature,
    acceptedAt: new Date(),
    agreementText,
  });

  // Update project funding
  project.fundedAmount += investAmount;
  if (project.fundedAmount >= project.targetFunding) {
    project.status = 'Construction';
  }
  await project.save();

  // Create investment record
  const sharesOwned = Math.floor(investAmount / 100);
  const investment = await Investment.create({
    user: req.user.id,
    project: project._id,
    amount: investAmount,
    sharesOwned,
    durationMonths: lockMonths,
    maturityDate,
    agreement: agreement._id,
    status: 'Locked',
  });

  // Send notifications
  await Notification.create({
    user: req.user.id,
    title: 'Investment Successful!',
    message: `You successfully invested ₹${investAmount.toLocaleString()} in ${project.name} locked for ${lockMonths} months.`,
    type: 'Success',
  });

  if (adminUser) {
    await Notification.create({
      user: adminUser._id,
      title: 'New Project Investment',
      message: `Investor ${req.user.name} successfully invested ₹${investAmount.toLocaleString()} in ${project.name}.`,
      type: 'Success',
    });
  }

  res.status(201).json({ success: true, data: investment });
});

// @desc    Get investor portfolio metrics
// @route   GET /api/investments/portfolio
// @access  Private
export const getPortfolio = asyncHandler(async (req, res) => {
  const investments = await Investment.find({ user: req.user.id }).populate('project').populate('agreement');

  // De-duplicate any orphan duplicate investment records created by checkout retries
  const cleanInvestments = [];
  for (let inv of investments) {
    let isDuplicate = false;
    for (let cleanInv of cleanInvestments) {
      if (
        inv.project && cleanInv.project &&
        inv.project._id.toString() === cleanInv.project._id.toString() &&
        inv.amount === cleanInv.amount &&
        Math.abs(new Date(inv.createdAt) - new Date(cleanInv.createdAt)) < 30000
      ) {
        isDuplicate = true;
        break;
      }
    }

    if (isDuplicate) {
      await Investment.findByIdAndDelete(inv._id);
      if (inv.agreement) {
        await InvestorAgreement.findByIdAndDelete(inv.agreement._id || inv.agreement);
      }
    } else {
      cleanInvestments.push(inv);
    }
  }

  let totalInvested = 0;
  let totalProfit = 0;
  let portfolioValue = 0;
  let activeCount = 0;
  let lockedCount = 0;
  let maturedCount = 0;
  let withdrawnCount = 0;
  let nextMaturityDate = null;

  const updatedInvestmentsList = [];

  for (let inv of cleanInvestments) {
    const invAmt = inv.amount;
    const roiPercentage = inv.project.expectedROI || 10;
    
    // Calculate expected profit return
    const profit = invAmt * (inv.project.expectedROI / 100) * (inv.durationMonths / 12);
    
    // Check if maturity has passed
    const isMatured = new Date() >= new Date(inv.maturityDate);
    
    // Check and repair legacy Active status records
    if ((inv.status === 'Locked' || inv.status === 'Active') && isMatured) {
      inv.status = 'Matured';
      await inv.save();
      
      // Notify investor
      await Notification.create({
        user: req.user.id,
        title: 'Investment Matured!',
        message: `Your investment of ₹${invAmt.toLocaleString()} in ${inv.project.name} has matured. You can now request withdrawal.`,
        type: 'Success',
      });
    } else if (inv.status === 'Active') {
      inv.status = 'Locked';
      await inv.save();
    }

    if (inv.status === 'Locked') {
      lockedCount++;
      portfolioValue += invAmt;
      // Track next maturity
      if (!nextMaturityDate || new Date(inv.maturityDate) < new Date(nextMaturityDate)) {
        nextMaturityDate = inv.maturityDate;
      }
    } else if (inv.status === 'Matured') {
      maturedCount++;
      portfolioValue += (invAmt + profit);
      totalProfit += profit;
    } else if (inv.status === 'Withdrawn') {
      withdrawnCount++;
    }

    totalInvested += invAmt;
    updatedInvestmentsList.push(inv);
  }

  res.status(200).json({
    success: true,
    data: {
      totalInvested,
      portfolioValue,
      totalProfit,
      lockedCount,
      activeCount,
      maturedCount,
      withdrawnCount,
      nextMaturityDate,
      investmentsList: updatedInvestmentsList,
    },
  });
});

// @desc    Get all platform investments (Admin)
// @route   GET /api/investments/all
// @access  Private/Admin
export const getAllInvestmentsAdmin = asyncHandler(async (req, res) => {
  const investments = await Investment.find({})
    .populate('user', 'name email')
    .populate('project', 'name expectedROI status')
    .populate('agreement');
  res.status(200).json({ success: true, data: investments });
});

// @desc    Request investment withdrawal (Post-maturity)
// @route   POST /api/investments/withdraw/:investmentId
// @access  Private
export const requestWithdrawal = asyncHandler(async (req, res) => {
  const investment = await Investment.findById(req.params.investmentId).populate('project');

  if (!investment) {
    return res.status(404).json({ success: false, error: 'Investment record not found' });
  }

  if (investment.user.toString() !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Not authorized to withdraw this investment' });
  }

  if (new Date() < new Date(investment.maturityDate)) {
    return res.status(400).json({ success: false, error: 'Cannot withdraw locked funds before maturity date.' });
  }

  if (investment.status === 'Withdrawn') {
    return res.status(400).json({ success: false, error: 'This investment has already been withdrawn.' });
  }

  // Calculate profit payout
  const profit = investment.amount * (investment.project.expectedROI / 100) * (investment.durationMonths / 12);
  const totalPayout = investment.amount + profit;

  // Create pending withdrawal request record
  const request = await WithdrawalRequest.create({
    user: req.user.id,
    investment: investment._id,
    amount: totalPayout,
  });

  // Notify admin
  const adminUser = await User.findOne({ role: 'Admin' });
  if (adminUser) {
    await Notification.create({
      user: adminUser._id,
      title: 'Pending Withdrawal Request',
      message: `User ${req.user.name} requested withdrawal of ₹${totalPayout.toLocaleString()} from matured project ${investment.project.name}.`,
      type: 'Warning',
    });
  }

  res.status(200).json({
    success: true,
    message: `Withdrawal request of ₹${totalPayout.toLocaleString()} submitted for administrator approval.`,
    data: request,
  });
});

// @desc    Get all pending withdrawal requests (Admin only)
// @route   GET /api/investments/admin/withdrawals
// @access  Private/Admin
export const getWithdrawalsAdmin = asyncHandler(async (req, res) => {
  const requests = await WithdrawalRequest.find({ status: 'Pending' })
    .populate('user', 'name email')
    .populate({
      path: 'investment',
      populate: { path: 'project' }
    });
  res.status(200).json({ success: true, data: requests });
});

// @desc    Approve/Reject withdrawal request (Admin only)
// @route   PUT /api/investments/admin/withdrawals/:id/approve
// @access  Private/Admin
export const approveWithdrawalAdmin = asyncHandler(async (req, res) => {
  const { status } = req.body; // Approved or Rejected
  const request = await WithdrawalRequest.findById(req.params.id);

  if (!request) {
    return res.status(404).json({ success: false, error: 'Withdrawal request not found' });
  }

  request.status = status;
  await request.save();

  const investment = await Investment.findById(request.investment);
  if (investment) {
    if (status === 'Approved') {
      investment.status = 'Withdrawn';
      await investment.save();

      // Add payout back to user's wallet balance
      const profile = await Profile.findOne({ user: request.user });
      if (profile) {
        profile.balance += request.amount;
        await profile.save();
      }

      // Notify investor
      await Notification.create({
        user: request.user,
        title: 'Withdrawal Approved!',
        message: `Your matured payout of ₹${request.amount.toLocaleString()} was approved and credited back to your wallet.`,
        type: 'Success',
      });
    } else {
      // If rejected, set investment back to Matured
      investment.status = 'Matured';
      await investment.save();
    }
  }

  res.status(200).json({ success: true, data: request });
});

// @desc    Simulate periodic ROI auto payouts (Monthly/Yearly interest & matured lock release)
// @route   POST /api/investments/simulate-payouts
// @access  Private
export const simulateROIPayouts = asyncHandler(async (req, res) => {
  const investments = await Investment.find({ user: req.user.id, status: { $in: ['Locked', 'Matured'] } }).populate('project');
  const profile = await Profile.findOne({ user: req.user.id });

  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  let payoutsDispatched = 0;
  let totalPayoutAmount = 0;

  for (let inv of investments) {
    if (inv.status === 'Withdrawn') continue;

    const isMonthly = inv.durationMonths < 12;
    const roiPercentage = inv.project?.expectedROI || 10;
    
    let interestPayout = 0;
    let periodLabel = '';
    
    if (isMonthly) {
      interestPayout = inv.amount * (roiPercentage / 100) / 12;
      periodLabel = 'Monthly Auto Payout';
    } else {
      interestPayout = inv.amount * (roiPercentage / 100);
      periodLabel = 'Yearly Auto Payout';
    }

    inv.ROIRealized = (inv.ROIRealized || 0) + interestPayout;

    // Check maturity
    const isMatured = new Date() >= new Date(inv.maturityDate);
    let principalRelease = 0;

    if (inv.status === 'Locked' && isMatured) {
      inv.status = 'Matured';
    }

    if (inv.status === 'Matured') {
      principalRelease = inv.amount;
      inv.status = 'Withdrawn';
    }

    await inv.save();

    const totalPayout = interestPayout + principalRelease;
    profile.balance += totalPayout;
    totalPayoutAmount += totalPayout;
    payoutsDispatched++;

    if (principalRelease > 0) {
      await Notification.create({
        user: req.user.id,
        title: 'Investment Matured & Auto-Paid!',
        message: `Principal ₹${inv.amount.toLocaleString()} + Final ROI ₹${interestPayout.toLocaleString()} from ${inv.project?.name} has been auto-credited to your wallet.`,
        type: 'Success',
      });
    } else {
      await Notification.create({
        user: req.user.id,
        title: `${periodLabel} Dispatched`,
        message: `Auto-Payout interest of ₹${interestPayout.toFixed(2)} from project ${inv.project?.name} was credited to your wallet balance.`,
        type: 'Success',
      });
    }
  }

  if (payoutsDispatched > 0) {
    await profile.save();
  }

  res.status(200).json({
    success: true,
    message: `Successfully processed auto-payout simulation. Total credited to wallet: ₹${totalPayoutAmount.toLocaleString('en-IN')}`,
    balance: profile.balance,
  });
});
