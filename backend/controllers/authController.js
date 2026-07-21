import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import asyncHandler from '../utils/asyncHandler.js';
import transporter from '../config/mail.js';

// Helper to sign JWT and set token cookie
const sendTokenResponse = (user, statusCode, res, rememberMe = false) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'super_secret_jwt_key_solartrade_2026_go_green',
    { expiresIn: '30d' }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  if (rememberMe) {
    cookieOptions.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, referralCode } = req.body;

  if (role === 'Admin') {
    return res.status(400).json({ success: false, error: 'Registration with Admin role is not allowed' });
  }

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, error: 'Email already registered' });
  }

  // Create verification token
  const verificationToken = crypto.randomBytes(20).toString('hex');

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'Customer',
    verificationToken,
  });

  // Check if referred by someone
  let referredByUser = null;
  if (referralCode) {
    const referrerProfile = await Profile.findOne({ referralCode });
    if (referrerProfile) {
      referredByUser = referralCode;
      // Add referral reward points
      referrerProfile.rewardPoints += 100;
      referrerProfile.achievements.push({
        title: 'Referrer Enthusiast',
        description: 'Successfully referred a new green user to Solar Trade.',
      });
      await referrerProfile.save();
    }
  }

  // Create empty profile
  const profileReferral = `ST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  await Profile.create({
    user: user._id,
    referralCode: profileReferral,
    referredBy: referredByUser,
    rewardPoints: referredByUser ? 50 : 0, // reward referee
  });

  // Send verification email
  const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;
  const message = `Welcome to Solar Trade! Verify your email by clicking the link: \n\n ${verifyUrl}`;

  try {
    await transporter.sendMail({
      to: user.email,
      subject: 'Email Verification - Solar Trade',
      text: message,
    });
  } catch (error) {
    console.error('Email could not be sent', error);
  }

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Please provide email and password' });
  }

  // Check user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  sendTokenResponse(user, 200, res, rememberMe);
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
export const logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
});

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  // Generate and hash password token
  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins

  await user.save();

  // Send email
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
  const message = `You are receiving this email because you requested a password reset. Click: \n\n ${resetUrl}`;

  try {
    await transporter.sendMail({
      to: user.email,
      subject: 'Password Reset Token',
      text: message,
    });
    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return res.status(500).json({ success: false, error: 'Email could not be sent' });
  }
});

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, error: 'Invalid or expired token' });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Verify Email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({ verificationToken: req.params.token });

  if (!user) {
    return res.status(400).json({ success: false, error: 'Invalid verification link' });
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();

  // Add a welcoming badge/points
  const profile = await Profile.findOne({ user: user._id });
  if (profile) {
    profile.rewardPoints += 50;
    profile.achievements.push({
      title: 'Verified Green Citizen',
      description: 'Successfully verified email address.',
    });
    await profile.save();
  }

  // Return HTML or redirect or json
  res.status(200).send(`
    <html>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #22c55e;">Verification Successful!</h1>
        <p>Your email has been verified. You can now close this tab and log in to Solar Trade.</p>
      </body>
    </html>
  `);
});

// @desc    Change Password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    return res.status(401).json({ success: false, error: 'Incorrect current password' });
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});
