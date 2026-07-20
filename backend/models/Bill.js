import mongoose from 'mongoose';

const billSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    billDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    unitsConsumed: {
      type: Number,
      required: true,
    },
    ratePerUnit: {
      type: Number,
      required: true,
    },
    fixedCharges: {
      type: Number,
      default: 15.0, // base connection charge
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Unpaid', 'Paid', 'Overdue'],
      default: 'Unpaid',
    },
    paymentReference: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Bill = mongoose.model('Bill', billSchema);
export default Bill;
