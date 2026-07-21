import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Plan from '../models/Plan.js';
import Project from '../models/Project.js';
import Bill from '../models/Bill.js';
import Notification from '../models/Notification.js';
import EnergyTrade from '../models/EnergyTrade.js';
import connectDB from '../config/db.js';

dotenv.config();

// Ensure DB connects
await connectDB();

const seedData = async () => {
  try {
    // We do NOT clear the database to avoid wiping user-entered data

    // 1. Create Admin if it does not exist
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
      console.log('Admin user seeded.');
    } else if (adminUser.name !== 'admin') {
      adminUser.name = 'admin';
      adminUser.password = 'admin123';
      await adminUser.save();
      console.log('Admin user updated to match required specifications.');
    } else {
      console.log('Admin user already exists.');
    }

    // 2. Engineer seeding retired (Role removed)

    // 3. Create 15 Energy Plans if empty
    const plansCount = await Plan.countDocuments();
    if (plansCount === 0) {
      const plansData = [
        { name: 'Eco Starter', ratePerUnit: 10.0, description: 'Perfect for small apartments starting their eco-friendly energy journey.' },
        { name: 'Eco Starter Pro', ratePerUnit: 9.0, description: 'Optimized rates for townhouses with moderate electricity usage.' },
        { name: 'Solar Boost Fixed', ratePerUnit: 8.0, description: 'Flat rate subscription with guaranteed 100% green solar backing.' },
        { name: 'Green Family Choice', ratePerUnit: 7.5, description: 'Tiered energy plan ideal for standard suburban homes.' },
        { name: 'Ultra Solar Saver', ratePerUnit: 6.0, description: 'Super low unit rates for properties with solar panel hookups.' },
        { name: 'Commercial Green Power', ratePerUnit: 5.5, description: 'High-volume renewable energy solution for commercial properties.' },
        { name: 'Eco Flow Flexible', ratePerUnit: 11.0, description: 'No lock-in contracts with floating rates for maximum agility.' },
        { name: 'Smart Grid Basic', ratePerUnit: 9.5, description: 'Standard energy connection for residential smart meters.' },
        { name: 'Smart Grid Premium', ratePerUnit: 8.5, description: 'Priority green grid connection with real-time feedback reports.' },
        { name: 'Solar Flare Residential', ratePerUnit: 8.0, description: 'Subsidized rate plan supported by regional solar fields.' },
        { name: 'Clean Energy Max', ratePerUnit: 7.0, description: 'Maximum renewable fuel sourcing with high monthly carbon savings.' },
        { name: 'Carbon Neutral Saver', ratePerUnit: 10.5, description: '100% offset package combining solar, wind, and biomass.' },
        { name: 'Green Horizon Tiered', ratePerUnit: 9.0, pricingType: 'Tiered', description: 'Low rates for initial units, scaling gradually for high usage.' },
        { name: 'Tesla Home Powerplan', ratePerUnit: 6.5, description: 'Optimized rates for Powerwall battery owners and EV charging.' },
        { name: 'Solar Trade Unlimited', ratePerUnit: 5.0, description: 'Enterprise-level plan for major industrial energy requirements.' }
      ];

      for (const p of plansData) {
        await Plan.create({
          ...p,
          minimumContractMonths: 12,
          features: ['100% Renewable energy', 'Carbon offset certificate', 'Real-time billing feedback', 'No connection fees']
        });
      }
      console.log('15 Energy Plans seeded.');
    } else {
      console.log('Energy Plans already exist. Skipping plans seeding.');
    }

    // 4. Create 20 Solar Projects if empty
    const projectsCount = await Project.countDocuments();
    if (projectsCount === 0) {
      const locations = ['Amritsar, Punjab', 'Phagwara, Punjab', 'Jalandhar, Punjab', 'Rajasthan', 'Jaipur, Rajasthan', 'Ludhiana, Punjab'];
      for (let i = 1; i <= 20; i++) {
        const targetFunding = 50000 + i * 25000;
        await Project.create({
          name: `Solar Field Project ${String(i).padStart(2, '0')}`,
          description: `High-yield grid-interactive solar farm installation in ${locations[i % locations.length]}. Utilizing next-gen double-sided panels to capture up to 30% more energy.`,
          targetFunding,
          fundedAmount: i % 3 === 0 ? targetFunding : Math.floor(targetFunding * 0.45),
          status: i % 3 === 0 ? 'Operational' : (i % 2 === 0 ? 'Construction' : 'Funding'),
          location: locations[i % locations.length],
          expectedROI: 8.5 + (i % 5),
          energyGeneratedMwh: i % 3 === 0 ? 120 + i * 15 : 0,
          coverImage: '',
          minimumInvestment: 10000,
          maximumInvestment: 500000,
          maximumCapacity: targetFunding
        });
      }
      console.log('20 Projects seeded.');
    } else {
      console.log('Projects already exist. Skipping projects seeding.');
    }

    // 9. Seed Global/Admin Notification if empty
    const notificationsCount = await Notification.countDocuments();
    if (notificationsCount === 0) {
      await Notification.create({
        user: null,
        title: 'Welcome to Solar Trade!',
        message: 'Solar Trade platform version 1.0 is live! Browse projects, set up solar panels, or trade excess grid power.',
        type: 'Announcement',
        readStatus: false
      });
      console.log('Initial notification Announcement seeded.');
    }

    console.log('Database Seeder Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
};

seedData();
