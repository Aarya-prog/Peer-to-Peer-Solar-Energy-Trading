import mongoose from 'mongoose';

const maintenanceRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    installation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Installation',
      default: null,
    },
    engineer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['Pending', 'Scheduled', 'Completed'],
      default: 'Pending',
    },
    description: {
      type: String,
      required: [true, 'Please provide a maintenance request description'],
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    serviceReport: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const MaintenanceRequest = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
export default MaintenanceRequest;
