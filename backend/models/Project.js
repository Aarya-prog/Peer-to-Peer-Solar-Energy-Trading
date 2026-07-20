import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a project name'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a project description'],
    },
    targetFunding: {
      type: Number,
      required: [true, 'Please provide target funding amount'],
    },
    fundedAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Funding', 'Construction', 'Operational'],
      default: 'Funding',
    },
    location: {
      type: String,
      required: [true, 'Please provide project location'],
    },
    expectedROI: {
      type: Number,
      required: [true, 'Please provide expected ROI percentage'],
    },
    energyGeneratedMwh: {
      type: Number,
      default: 0,
    },
    coverImage: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Project = mongoose.model('Project', projectSchema);
export default Project;
