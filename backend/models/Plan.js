import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a plan name'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a plan description'],
    },
    pricingType: {
      type: String,
      enum: ['Fixed', 'Tiered'],
      default: 'Fixed',
    },
    ratePerUnit: {
      type: Number,
      required: [true, 'Please provide rate per unit'],
    },
    minimumContractMonths: {
      type: Number,
      default: 12,
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Plan = mongoose.model('Plan', planSchema);
export default Plan;
