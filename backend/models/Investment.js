import mongoose from 'mongoose';

const investmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide investment amount'],
    },
    sharesOwned: {
      type: Number,
      default: 0,
    },
    ROIRealized: {
      type: Number,
      default: 0,
    },
    durationMonths: {
      type: Number,
      default: 1,
    },
    maturityDate: {
      type: Date,
      required: true,
    },
    agreement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InvestorAgreement',
      default: null,
    },
    status: {
      type: String,
      enum: ['Active', 'Locked', 'Matured', 'Withdrawn'],
      default: 'Locked',
    },
  },
  { timestamps: true }
);

const Investment = mongoose.model('Investment', investmentSchema);
export default Investment;
