import EnergyTrade from '../models/EnergyTrade.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    List surplus energy for sale
// @route   POST /api/marketplace/list
// @access  Private
export const listEnergyForSale = asyncHandler(async (req, res) => {
  const { unitsKwh, pricePerUnit } = req.body;

  if (!unitsKwh || !pricePerUnit) {
    return res.status(400).json({ success: false, error: 'Please provide units in kWh and price per unit' });
  }

  const totalAmount = unitsKwh * pricePerUnit;

  const listing = await EnergyTrade.create({
    seller: req.user.id,
    unitsKwh,
    pricePerUnit,
    totalAmount,
    status: 'Listed',
  });

  // Log in user profile achievements
  const profile = await Profile.findOne({ user: req.user.id });
  if (profile) {
    profile.rewardPoints += 20;
    if (!profile.badges.includes('Grid Contributor')) {
      profile.badges.push('Grid Contributor');
    }
    await profile.save();
  }

  res.status(201).json({ success: true, data: listing });
});

// @desc    Browse active energy listings (Search & filter)
// @route   GET /api/marketplace/listings
// @access  Private
export const getActiveListings = asyncHandler(async (req, res) => {
  const { maxPrice, minUnits } = req.query;

  const query = { status: 'Listed', seller: { $ne: req.user.id } };

  if (maxPrice) {
    query.pricePerUnit = { $lte: parseFloat(maxPrice) };
  }
  if (minUnits) {
    query.unitsKwh = { $gte: parseFloat(minUnits) };
  }

  const listings = await EnergyTrade.find(query).populate('seller', 'name email');
  res.status(200).json({ success: true, data: listings });
});

// @desc    Purchase listed energy (Simulate transaction)
// @route   POST /api/marketplace/buy/:id
// @access  Private
export const buyEnergy = asyncHandler(async (req, res) => {
  if (req.user.role === 'Admin') {
    return res.status(403).json({ success: false, error: 'Admins cannot buy energy' });
  }

  const trade = await EnergyTrade.findById(req.params.id);

  if (!trade) {
    return res.status(404).json({ success: false, error: 'Listing not found' });
  }

  if (trade.status !== 'Listed') {
    return res.status(400).json({ success: false, error: 'Listing is no longer active' });
  }

  if (trade.seller.toString() === req.user.id) {
    return res.status(400).json({ success: false, error: 'You cannot buy your own energy listing' });
  }

  // Check buyer and seller profiles
  const buyerProfile = await Profile.findOne({ user: req.user.id });
  if (!buyerProfile) {
    return res.status(404).json({ success: false, error: 'Buyer profile not found' });
  }

  if (buyerProfile.balance < trade.totalAmount) {
    return res.status(400).json({ success: false, error: 'Insufficient funds in your account balance' });
  }

  const sellerProfile = await Profile.findOne({ user: trade.seller });
  if (!sellerProfile) {
    return res.status(404).json({ success: false, error: 'Seller profile not found' });
  }

  // Deduct from buyer, add to seller
  buyerProfile.balance -= trade.totalAmount;
  sellerProfile.balance += trade.totalAmount;

  // Set buyer and status
  trade.buyer = req.user.id;
  trade.status = 'Completed';
  await trade.save();

  // Deduct/add reward points, calculate simulated platform commission (5%)
  const commission = trade.totalAmount * 0.05;
  console.log(`Platform commission collected: $${commission.toFixed(2)}`);

  // Credit platform commission to Admin wallet balance
  const adminUser = await User.findOne({ role: 'Admin' });
  if (adminUser) {
    const adminProfile = await Profile.findOne({ user: adminUser._id });
    if (adminProfile) {
      adminProfile.balance += commission;
      await adminProfile.save();
    }
  }

  // Award rewards to buyer & seller
  buyerProfile.rewardPoints += 30;
  if (!buyerProfile.badges.includes('Eco Buyer')) {
    buyerProfile.badges.push('Eco Buyer');
  }
  buyerProfile.achievements.push({
    title: 'P2P Energy Trade Complete',
    description: `Bought ${trade.unitsKwh} kWh of green energy from peer.`,
  });
  await buyerProfile.save();

  sellerProfile.rewardPoints += 50;
  sellerProfile.achievements.push({
    title: 'Green Merchant',
    description: `Sold ${trade.unitsKwh} kWh of surplus clean power.`,
  });
  await sellerProfile.save();

  // Send notifications
  await Notification.create({
    user: trade.seller,
    title: 'Energy Sold!',
    message: `Your listing of ${trade.unitsKwh} kWh has been purchased by ${req.user.name} for $${trade.totalAmount.toFixed(2)}.`,
    type: 'Success',
  });

  await Notification.create({
    user: req.user.id,
    title: 'Energy Purchased!',
    message: `You successfully bought ${trade.unitsKwh} kWh from peer seller.`,
    type: 'Success',
  });

  if (adminUser) {
    await Notification.create({
      user: adminUser._id,
      title: 'Customer P2P Purchase Complete',
      message: `Customer ${req.user.name} bought ${trade.unitsKwh} kWh surplus energy from seller for ₹${trade.totalAmount.toFixed(2)}.`,
      type: 'Success',
    });
  }

  res.status(200).json({ success: true, data: trade });
});

// @desc    Get user's marketplace transaction history (buy & sell)
// @route   GET /api/marketplace/trades
// @access  Private
export const getMyTrades = asyncHandler(async (req, res) => {
  const trades = await EnergyTrade.find({
    $or: [{ seller: req.user.id }, { buyer: req.user.id }],
  })
    .populate('seller', 'name email')
    .populate('buyer', 'name email');

  res.status(200).json({ success: true, data: trades });
});

// @desc    Get all platform trades with commissions (Admin)
// @route   GET /api/marketplace/admin/trades
// @access  Private/Admin
export const getAllTradesAdmin = asyncHandler(async (req, res) => {
  const trades = await EnergyTrade.find({})
    .populate('seller', 'name email')
    .populate('buyer', 'name email');

  const formattedTrades = trades.map((t) => {
    const commission = t.status === 'Completed' ? t.totalAmount * 0.05 : 0;
    return {
      ...t.toObject(),
      commission,
    };
  });

  res.status(200).json({ success: true, data: formattedTrades });
});

// @desc    Direct purchase from operational solar plant
// @route   POST /api/marketplace/buy-direct
// @access  Private
export const buyDirectPlantEnergy = asyncHandler(async (req, res) => {
  if (req.user.role === 'Admin') {
    return res.status(403).json({ success: false, error: 'Admins cannot buy energy' });
  }

  const { plantId, unitsKwh, ratePerUnit, totalAmount } = req.body;

  if (!plantId || !unitsKwh || !ratePerUnit || !totalAmount) {
    return res.status(400).json({ success: false, error: 'Please provide plantId, units, rate, and amount' });
  }

  // Find buyer profile
  const profile = await Profile.findOne({ user: req.user.id });
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Buyer profile not found' });
  }

  if (profile.balance < totalAmount) {
    return res.status(400).json({ success: false, error: 'Insufficient funds in your account balance' });
  }

  // Find company/admin user and add funds
  const adminUser = await User.findOne({ role: 'Admin' });
  if (adminUser) {
    const adminProfile = await Profile.findOne({ user: adminUser._id });
    if (adminProfile) {
      adminProfile.balance += totalAmount;
      await adminProfile.save();
    }
  }

  // Deduct from buyer
  profile.balance -= totalAmount;

  // Create a completed trade record
  const trade = await EnergyTrade.create({
    buyer: req.user.id,
    seller: adminUser ? adminUser._id : req.user.id, // seller represents Admin/Company for direct solar plants
    unitsKwh,
    pricePerUnit: ratePerUnit,
    totalAmount,
    status: 'Completed',
  });

  // Award reward points
  profile.rewardPoints += Math.floor(unitsKwh * 0.1); // 10% points
  if (!profile.badges.includes('Eco Buyer')) {
    profile.badges.push('Eco Buyer');
  }
  await profile.save();

  await Notification.create({
    user: req.user.id,
    title: 'Solar Energy Purchased',
    message: `You successfully bought ${unitsKwh} kWh directly from Regional Utility Grid.`,
    type: 'Success',
  });

  if (adminUser) {
    await Notification.create({
      user: adminUser._id,
      title: 'Customer Grid Purchase Complete',
      message: `Customer ${req.user.name} bought ${unitsKwh} kWh directly from Regional Utility Grid for ₹${totalAmount.toFixed(2)}.`,
      type: 'Success',
    });
  }

  res.status(201).json({ success: true, data: trade });
});
