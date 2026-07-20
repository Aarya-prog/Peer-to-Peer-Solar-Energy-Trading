import Notification from '../models/Notification.js';
import Announcement from '../models/Announcement.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get user notifications (User-specific + Platform Announcements)
// @route   GET /api/notifications
// @access  Private
export const getMyNotifications = asyncHandler(async (req, res) => {
  const userNotifications = await Notification.find({
    $or: [{ user: req.user.id }, { user: null }],
  }).sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: userNotifications });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/read/:id
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }

  // Authorize: check if user null (global) or belongs to user
  if (notification.user && notification.user.toString() !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Not authorized to read this notification' });
  }

  notification.readStatus = true;
  await notification.save();

  res.status(200).json({ success: true, data: notification });
});

// @desc    Create a system announcement (Admin only)
// @route   POST /api/notifications/announcement
// @access  Private/Admin
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, targetRoles } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, error: 'Please provide title and content' });
  }

  // Create database Announcement record
  const announcement = await Announcement.create({
    title,
    content,
    targetRoles: targetRoles || ['Customer'],
    author: req.user.id,
  });

  // Create notifications for users fitting target roles
  // Here, we can create a single global notification where user: null for simplicity, 
  // marked as an Announcement type, which our frontend retrieves.
  await Notification.create({
    user: null, // global
    title: `Announcement: ${title}`,
    message: content,
    type: 'Announcement',
  });

  res.status(201).json({ success: true, data: announcement });
});
