import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['Bill', 'Investment', 'EnergyTrade', 'Deposit'],
      required: true,
    },
    method: {
      type: String,
      enum: ['Card', 'Wallet', 'UPI'],
      default: 'Card',
    },
    status: {
      type: String,
      enum: ['Pending', 'Success', 'Failed'],
      default: 'Pending',
    },
    checkoutId: {
      type: String,
      unique: true,
      required: true,
    },
    signature: {
      type: String,
      default: '',
    },
    referenceId: {
      type: String, // BillId, ProjectId, or TradeId
      required: true,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
