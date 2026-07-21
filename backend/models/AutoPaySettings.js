import mongoose from 'mongoose';

const autoPaySettingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Debit Card', 'Net Banking'],
      default: 'UPI',
    },
    billingDate: {
      type: Number,
      default: 1,
    },
    maxBillLimit: {
      type: Number,
      default: 5000,
    },
    paymentReminder: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const AutoPaySettings = mongoose.model('AutoPaySettings', autoPaySettingsSchema);
export default AutoPaySettings;
