require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { setupQueues } = require('./jobs/queue');
const { initializeWorker } = require('./jobs/worker');
const { initializeScheduler } = require('./jobs/jobScheduler');
const newsRoutes = require('./routes/news.routes');
const fetchRoutes = require('./routes/fetch.routes');
const contactRoutes = require('./routes/contact.routes');

// Initialize Express app
const app = express();

// Ensure PORT is set
const PORT = process.env.PORT || 3000;

// Configure CORS for multiple domains
const corsOptions = {
  origin: [
    // Local development
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8000',
    'http://127.0.0.1:3000',
    // Production domains
    'https://flash-patrika.vercel.app',
    'https://www.flash-patrika.vercel.app',
    // Add any other domains that need access
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // Enable CORS with options
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev')); // Logging

// Additional OPTIONS handler for preflight requests
app.options('*', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 200, // Allow 200 requests per minute per IP
  message: 'Too many requests, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});
app.use('/api', limiter);

// Simple in-memory cache for API responses
const responseCache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds cache TTL

// Cache middleware
app.use('/api/news', (req, res, next) => {
  const cacheKey = req.originalUrl || req.url;
  const cachedResponse = responseCache.get(cacheKey);
  
  if (cachedResponse && cachedResponse.expiry > Date.now()) {
    return res.json(cachedResponse.data);
  }
  
  // Store the original res.json method
  const originalJson = res.json;
  
  // Override res.json method to cache the response
  res.json = function(data) {
    // Only cache successful responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      responseCache.set(cacheKey, {
        data,
        expiry: Date.now() + CACHE_TTL
      });
      
      // Clean up expired cache entries periodically
      setTimeout(() => {
        responseCache.delete(cacheKey);
      }, CACHE_TTL);
    }
    
    // Call the original method
    return originalJson.call(this, data);
  };
  
  next();
});

// Routes
app.use('/api', newsRoutes);
app.use('/api', fetchRoutes);
app.use('/api/contact', contactRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const mongoStatusText = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    4: 'invalid'
  }[mongoStatus] || 'unknown';

  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    mongodb: {
      status: mongoStatusText,
      statusCode: mongoStatus
    },
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server first
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Then connect to MongoDB
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// MongoDB connection options
const mongooseOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  maxPoolSize: 10,
  minPoolSize: 1,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
  maxIdleTimeMS: 45000,
  autoIndex: process.env.NODE_ENV !== 'production'
};

// Only use SSL/TLS for Atlas or remote connections, not for localhost
if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('localhost') && !process.env.MONGODB_URI.includes('127.0.0.1')) {
  mongooseOptions.ssl = true;
  mongooseOptions.tls = true;
}

// Log connection information (masking sensitive parts of the URI)
let redactedUri = process.env.MONGODB_URI;
if (redactedUri) {
  try {
    // Try to create a URL object to parse the MongoDB URI
    const mongoUrl = new URL(redactedUri);
    // Mask the password if it exists
    if (mongoUrl.password) {
      mongoUrl.password = '********';
      redactedUri = mongoUrl.toString();
    }
  } catch (e) {
    // If we can't parse the URL, just mask part of the string
    redactedUri = redactedUri.replace(/\/\/[^:]+:([^@]+)@/, '//****:****@');
  }
  console.log(`Connecting to MongoDB at: ${redactedUri}`);
  console.log(`MongoDB connection options:`, JSON.stringify(mongooseOptions, null, 2));
}

console.log('Connecting to MongoDB...');

// Set up MongoDB connection monitoring
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB connection disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB connection reestablished');
});

// Connect to MongoDB with options
mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log('Connected to MongoDB');
    
    try {
      // Setup and start background jobs
      setupQueues();
      
      // Initialize worker for processing jobs
      const worker = initializeWorker();
      
      // Initialize job scheduler for periodic news updates
      initializeScheduler()
        .then(() => console.log('Job scheduler initialized successfully'))
        .catch(err => {
          console.error('Failed to initialize job scheduler:', err);
          console.log('Continuing without job scheduler...');
        });
      
      console.log('Background jobs system initialized');
    } catch (error) {
      console.error('Error initializing background jobs system:', error);
      console.log('Continuing without background jobs system...');
    }
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    // Don't exit the process, just log the error
    // This allows the server to keep running even if MongoDB is temporarily unavailable
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});