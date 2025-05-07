/**
 * Local Development Runner
 * This script sets up the correct environment variables and starts the application
 */

// Set environment variables before requiring the main application
process.env.PORT = 3001;
process.env.NODE_ENV = 'development';
process.env.MONGODB_URI = 'mongodb://localhost:27017/news-api';
process.env.SKIP_REDIS = 'true'; // Skip Redis entirely to avoid version issues

// Now require the main application
require('./src/index.js'); 