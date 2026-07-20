import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      default: '',
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zip: { type: String, default: '' },
    },
    profilePicture: {
      type: String,
      default: '',
    },
    governmentIdType: {
      type: String,
      enum: ['Aadhaar', 'PAN', 'VoterID', 'DriverLicense', 'None'],
      default: 'None',
    },
    governmentIdNumber: {
      type: String,
      default: '',
    },
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending',
    },
    verifiedLocation: {
      type: String,
      default: '',
    },
    preferences: {
      notificationsEnabled: { type: Boolean, default: true },
      themeMode: { type: String, enum: ['light', 'dark'], default: 'light' },
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: String,
      default: null,
    },
    rewardPoints: {
      type: Number,
      default: 0,
    },
    badges: {
      type: [String],
      default: [],
    },
    achievements: [
      {
        title: { type: String },
        description: { type: String },
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Profile = mongoose.model('Profile', profileSchema);
export default Profile;
