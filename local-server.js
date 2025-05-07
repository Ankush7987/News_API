/**
 * Simplified Local Development Server
 * This version bypasses Redis and background job processing
 */
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const newsRoutes = require('./src/routes/news.routes');
const fetchRoutes = require('./src/routes/fetch.routes');
const contactRoutes = require('./src/routes/contact.routes');

// Override environment variables
process.env.SKIP_REDIS = 'true';

// Initialize Express app
const app = express();

// Use port 3001 to avoid conflicts
const PORT = process.env.PORT || 3001;

// Configure CORS
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8000',
    'http://127.0.0.1:3000',
    'https://flash-patrika.vercel.app',
    'https://www.flash-patrika.vercel.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

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
    message: 'Server is running (simplified local version)',
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
app.listen(PORT, () => {
  console.log(`Simplified local server running on port ${PORT}`);
});

// MongoDB connection options optimized for local development
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
  autoIndex: true
};

console.log('Connecting to MongoDB...');
console.log(`MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/news-api'}`);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/news-api', mongooseOptions)
  .then(() => {
    console.log('✅ MongoDB connection established successfully');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.log('Server will continue running without MongoDB connection.');
  });

// Monitor connection
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB connection disconnected');
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during app shutdown:', err);
    process.exit(1);
  }
}); 