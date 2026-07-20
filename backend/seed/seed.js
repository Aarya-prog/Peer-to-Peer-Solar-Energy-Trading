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
    // Clear existing data
    await User.deleteMany();
    await Profile.deleteMany();
    await Plan.deleteMany();
    await Project.deleteMany();
    await Bill.deleteMany();
    await Notification.deleteMany();
    await EnergyTrade.deleteMany();

    console.log('Database cleared.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // 1. Create Admin
    const adminUser = await User.create({
      name: 'Eco Admin',
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

    // 2. Create 1 Engineer (for testing assignment workflow)
    const engineerUser = await User.create({
      name: 'Default Engineer',
      email: 'engineer@google.com',
      password: 'password123',
      role: 'Engineer',
      isVerified: true
    });
    await Profile.create({
      user: engineerUser._id,
      phone: '+919876543211',
      address: { street: 'GT Road', city: 'Phagwara', state: 'Punjab', zip: '144401' },
      referralCode: 'ENGREF1',
      governmentIdType: 'Aadhaar',
      governmentIdNumber: '123456789012',
      verificationStatus: 'Verified',
      verifiedLocation: 'Phagwara, Punjab'
    });
    console.log('1 Engineer seeded.');

    // 3. Create 15 Energy Plans
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

    const plans = [];
    for (const p of plansData) {
      const planObj = await Plan.create({
        ...p,
        minimumContractMonths: 12,
        features: ['100% Renewable energy', 'Carbon offset certificate', 'Real-time billing feedback', 'No connection fees']
      });
      plans.push(planObj);
    }
    console.log('15 Energy Plans seeded.');

    // 4. Create 20 Solar Projects
    const locations = ['Amritsar, Punjab', 'Phagwara, Punjab', 'Jalandhar, Punjab', 'Rajasthan', 'Jaipur, Rajasthan', 'Ludhiana, Punjab'];
    const projects = [];
    for (let i = 1; i <= 20; i++) {
      const targetFunding = 50000 + i * 25000;
      const project = await Project.create({
        name: `Solar Field Project ${String(i).padStart(2, '0')}`,
        description: `High-yield grid-interactive solar farm installation in ${locations[i % locations.length]}. Utilizing next-gen double-sided panels to capture up to 30% more energy.`,
        targetFunding,
        fundedAmount: i % 3 === 0 ? targetFunding : Math.floor(targetFunding * 0.45),
        status: i % 3 === 0 ? 'Operational' : (i % 2 === 0 ? 'Construction' : 'Funding'),
        location: locations[i % locations.length],
        expectedROI: 8.5 + (i % 5),
        energyGeneratedMwh: i % 3 === 0 ? 120 + i * 15 : 0,
        coverImage: ''
      });
      projects.push(project);
    }
    console.log('20 Projects seeded.');

    // 9. Seed Global/Admin Notification
    await Notification.create({
      user: null,
      title: 'Welcome to Solar Trade!',
      message: 'Solar Trade platform version 1.0 is live! Browse projects, set up solar panels, or trade excess grid power.',
      type: 'Announcement',
      readStatus: false
    });
    console.log('Initial notification Announcement seeded.');

    // 10. Seed neighbor users & active P2P energy listings
    const neighborA = await User.create({
      name: 'Aditya Sharma (Neighbor)',
      email: 'aditya@google.com',
      password: hashedPassword,
      role: 'Customer',
      isVerified: true
    });
    await Profile.create({
      user: neighborA._id,
      phone: '+919876543222',
      address: { street: 'Lakeside Lane', city: 'Jalandhar', state: 'Punjab', zip: '144001' },
      referralCode: 'NEIGHBORA',
      governmentIdType: 'PAN',
      governmentIdNumber: 'ABCDE1234F',
      verificationStatus: 'Verified',
      verifiedLocation: 'Jalandhar, Punjab'
    });

    const neighborB = await User.create({
      name: 'Pooja Patel (Neighbor)',
      email: 'pooja@google.com',
      password: hashedPassword,
      role: 'Customer',
      isVerified: true
    });
    await Profile.create({
      user: neighborB._id,
      phone: '+919876543233',
      address: { street: 'Green Valley Road', city: 'Jaipur', state: 'Rajasthan', zip: '302001' },
      referralCode: 'NEIGHBORB',
      governmentIdType: 'Aadhaar',
      governmentIdNumber: '987654321098',
      verificationStatus: 'Verified',
      verifiedLocation: 'Jaipur, Rajasthan'
    });

    await EnergyTrade.create({
      seller: neighborA._id,
      unitsKwh: 120,
      pricePerUnit: 7.0,
      totalAmount: 840.0,
      status: 'Listed'
    });

    await EnergyTrade.create({
      seller: neighborA._id,
      unitsKwh: 200,
      pricePerUnit: 6.8,
      totalAmount: 1360.0,
      status: 'Listed'
    });

    await EnergyTrade.create({
      seller: neighborB._id,
      unitsKwh: 80,
      pricePerUnit: 7.2,
      totalAmount: 576.0,
      status: 'Listed'
    });

    console.log('Neighbor users & P2P active listings seeded.');

    console.log('Database Seeder Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
};

seedData();
