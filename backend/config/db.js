import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/solartrade');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Ensure default Admin user exists
    let adminUser = await User.findOne({ email: 'admin@google.com' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'admin',
        email: 'admin@google.com',
        password: 'admin123',
        role: 'Admin',
        isVerified: true
      });
      await Profile.create({
        user: adminUser._id,
        phone: '+919876543210',
        address: { street: 'Mall Road', city: 'Amritsar', state: 'Punjab', zip: '143001' },
        referralCode: 'ADMINREF',
        governmentIdType: 'PAN',
        governmentIdNumber: 'ABCDE1234F',
        verificationStatus: 'Verified',
        verifiedLocation: 'Amritsar, Punjab'
      });
      console.log('Default Admin user initialized successfully.');
    } else if (adminUser.name !== 'admin') {
      adminUser.name = 'admin';
      adminUser.password = 'admin123';
      await adminUser.save();
      console.log('Admin user updated to match required specifications.');
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.warn('Warning: Server will continue running, but database operations will fail if MongoDB is not running.');
  }
};

export default connectDB;
