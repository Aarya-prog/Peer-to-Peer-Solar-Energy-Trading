import mongoose from 'mongoose';

const kycSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, 'Please provide full legal name'],
    },
    dob: {
      type: Date,
      required: [true, 'Please provide date of birth'],
    },
    panNumber: {
      type: String,
      required: [true, 'Please provide PAN card number'],
      trim: true,
    },
    aadhaarNumber: {
      type: String,
      required: [true, 'Please provide Aadhaar number'],
      trim: true,
    },
    gstNumber: {
      type: String,
      default: '',
    },
    bankName: {
      type: String,
      required: [true, 'Please provide bank name'],
    },
    accountHolderName: {
      type: String,
      required: [true, 'Please provide account holder name'],
    },
    accountNumber: {
      type: String,
      required: [true, 'Please provide bank account number'],
    },
    ifscCode: {
      type: String,
      required: [true, 'Please provide bank IFSC code'],
    },
    upiId: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      required: [true, 'Please provide full residential address'],
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    identityProof: {
      type: String,
      default: '',
    },
    addressProof: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'Verified', 'Rejected'],
      default: 'Pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const KYC = mongoose.model('KYC', kycSchema);
export default KYC;
