import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const supportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Please provide a support ticket subject'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Please provide support ticket details'],
    },
    category: {
      type: String,
      enum: ['Billing', 'Installation', 'Marketplace', 'General'],
      default: 'General',
    },
    status: {
      type: String,
      enum: ['Open', 'InProgress', 'Closed'],
      default: 'Open',
    },
    replies: [replySchema],
  },
  { timestamps: true }
);

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export default SupportTicket;
