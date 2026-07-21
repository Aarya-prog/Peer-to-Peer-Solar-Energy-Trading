import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Middlewares
import errorHandler from './middleware/error.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import planRoutes from './routes/planRoutes.js';
import installationRoutes from './routes/installationRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';
import investmentRoutes from './routes/investmentRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import kycRoutes from './routes/kycRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading images in frontend
}));

// CORS Configuration
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 10000, // higher limit in dev to prevent 429 blockages
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/subscriptions', planRoutes);
app.use('/api/installations', installationRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/kyc', kycRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Solar Trade REST API is running.');
});

// Centralized error handler
app.use(errorHandler);

export default app;
