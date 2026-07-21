import mongoose from 'mongoose';

const investorAgreementSchema = new mongoose.Schema(
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
    investmentAmount: {
      type: Number,
      required: true,
    },
    planDuration: {
      type: Number,
      required: true,
    },
    expectedROI: {
      type: Number,
      required: true,
    },
    legalNameSignature: {
      type: String,
      required: [true, 'Legal digital signature is required'],
    },
    acceptedAt: {
      type: Date,
      default: Date.now,
    },
    agreementText: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const InvestorAgreement = mongoose.model('InvestorAgreement', investorAgreementSchema);
export default InvestorAgreement;
