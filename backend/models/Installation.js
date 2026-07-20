import mongoose from 'mongoose';

const installationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Request', 'Site Inspection', 'Quotation', 'Engineer Assignment', 'Installation', 'Completed', 'Maintenance'],
      default: 'Request',
    },
    panelCapacityKw: {
      type: Number,
      required: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
    },
    quoteAmount: {
      type: Number,
      default: 0,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    engineer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    inspectionDate: {
      type: Date,
      default: null,
    },
    installationDate: {
      type: Date,
      default: null,
    },
    serviceReport: {
      type: String,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const Installation = mongoose.model('Installation', installationSchema);
export default Installation;
