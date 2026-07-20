import SupportTicket from '../models/SupportTicket.js';
import Feedback from '../models/Feedback.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Create support ticket
// @route   POST /api/support/tickets
// @access  Private
export const createTicket = asyncHandler(async (req, res) => {
  const { subject, message, category } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ success: false, error: 'Please provide subject and message' });
  }

  const ticket = await SupportTicket.create({
    user: req.user.id,
    subject,
    message,
    category: category || 'General',
  });

  // Notify admin
  await Notification.create({
    user: null,
    title: 'New Support Ticket',
    message: `User ${req.user.name} submitted a ticket: "${subject}"`,
    type: 'Info',
  });

  res.status(201).json({ success: true, data: ticket });
});

// @desc    Get support tickets (User's tickets or all tickets for Admin)
// @route   GET /api/support/tickets
// @access  Private
export const getTickets = asyncHandler(async (req, res) => {
  let tickets;

  if (req.user.role === 'Admin') {
    tickets = await SupportTicket.find({}).populate('user', 'name email').sort({ createdAt: -1 });
  } else {
    tickets = await SupportTicket.find({ user: req.user.id }).sort({ createdAt: -1 });
  }

  res.status(200).json({ success: true, data: tickets });
});

// @desc    Add reply to ticket
// @route   POST /api/support/tickets/:id/reply
// @access  Private
export const replyToTicket = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const ticket = await SupportTicket.findById(req.params.id);

  if (!ticket) {
    return res.status(404).json({ success: false, error: 'Ticket not found' });
  }

  // Auth check: Admin or ticket owner
  if (req.user.role !== 'Admin' && ticket.user.toString() !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Not authorized to reply to this ticket' });
  }

  ticket.replies.push({
    sender: req.user.id,
    content,
  });

  // Update status if replied by Admin vs User
  if (req.user.role === 'Admin') {
    ticket.status = 'InProgress';

    // Notify customer
    await Notification.create({
      user: ticket.user,
      title: 'Support Ticket Reply',
      message: `Admin replied to your ticket: "${ticket.subject}"`,
      type: 'Info',
    });
  }

  await ticket.save();
  res.status(200).json({ success: true, data: ticket });
});

// @desc    Submit platform feedback
// @route   POST /api/support/feedback
// @access  Private
export const submitFeedback = asyncHandler(async (req, res) => {
  const { rating, comments, category } = req.body;

  if (!rating || !comments) {
    return res.status(400).json({ success: false, error: 'Please provide rating and comments' });
  }

  const feedback = await Feedback.create({
    user: req.user.id,
    rating,
    comments,
    category: category || 'General',
  });

  res.status(201).json({ success: true, data: feedback });
});
export const getFeedbackAdmin = asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.find({}).populate('user', 'name email').sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: feedbacks });
});
