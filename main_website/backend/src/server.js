import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables FIRST before any other imports
const envPath = path.resolve(process.cwd(), '.env');
console.log('📁 Looking for .env file at:', envPath);
console.log('📁 Current working directory:', process.cwd());
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
} else {
  console.log('✅ .env file loaded successfully');
  console.log('📦 Parsed values:', result.parsed);
}

// Debug: Check if Gemini API key is loaded
console.log('🔍 Environment check:');
console.log('PORT:', process.env.PORT);
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...` : 'undefined');

// Now import everything else
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.js';
import patientAuthRoutes from './routes/patientAuth.js';
import patientRoutes from './routes/patient.js';
import patientAccessRoutes from './routes/patientAccess.js';
import medicalHistoryRoutes from './routes/medicalHistory.js';
import prescriptionRoutes from './routes/prescription.js';
import reportRoutes from './routes/reports.js';
import aiAssistantRoutes from './routes/aiAssistant.js';
import aiDoctorRoutes from './routes/aiDoctor.js';
import { summarizeReportWithGemini, testGeminiPrompt } from './services/geminiService.js';

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3002',
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://dhruv:Dhruv2006@cluster0.k9jzv1l.mongodb.net/aayulink?retryWrites=true&w=majority';
    
    await mongoose.connect(mongoURI, {
      // Remove deprecated options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Server will continue without database connection');
    console.log('💡 To fix: Add your IP address to MongoDB Atlas Network Access');
  }
};

// Connect to database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patient-auth', patientAuthRoutes);
console.log('✅ Mounted routes: /api/auth, /api/patient-auth');
app.use('/api/patient', patientRoutes);
app.use('/api/patient-access', patientAccessRoutes);
app.use('/api/medical-history', medicalHistoryRoutes);
app.use('/api/prescription', prescriptionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai-assistant', aiAssistantRoutes);
app.use('/api/ai-doctor', aiDoctorRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'AayuLink API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Patient auth health check
app.get('/api/health/patient-auth', (req, res) => {
  res.json({ success: true, route: '/api/patient-auth', methods: ['POST /request-otp', 'POST /verify-otp'] });
});

// Gemini health check
app.get('/api/health/gemini', async (req, res) => {
  try {
    const text = await summarizeReportWithGemini({
      title: 'Health Check',
      documentType: 'other',
      ocrText: 'Sample text',
      structuredData: { diagnosis: 'Sample' }
    });
    const usedRealKey = process.env.GEMINI_API_KEY && !/DUMMY_GEMINI_API_KEY_REPLACE_ME/i.test(process.env.GEMINI_API_KEY);
    res.json({ success: true, usedRealKey, sample: text?.slice(0, 120) });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'Gemini failed' });
  }
});

// Direct Gemini test endpoint
app.get('/api/health/gemini-test', async (req, res) => {
  try {
    const prompt = req.query.q || 'Say hello from Gemini';
    const text = await testGeminiPrompt(prompt);
    res.json({ success: true, text: text.slice(0, 500) });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'Gemini test failed' });
  }
});

// Database health endpoint
app.get('/api/health/db', (req, res) => {
  const state = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  res.json({
    success: true,
    mongo: {
      readyState: state,
      status: stateMap[state] || 'unknown'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message 
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 AayuLink Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});
