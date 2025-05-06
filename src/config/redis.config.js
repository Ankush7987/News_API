/**
 * Redis Configuration
 * 
 * This file contains configuration for Redis connection and BullMQ.
 * It provides a centralized place to manage Redis-related settings.
 */

const Redis = require('ioredis');

// Create Redis connection
const createRedisConnection = () => {
  const connection = new Redis({
    host: '127.0.0.1', // Use Docker Redis exposed via -p 6379:6379
    port: 6380 ,
    maxRetriesPerRequest: null, // Prevent deprecation warnings
    enableReadyCheck: true,
    retryStrategy: (times) => {
      // Exponential backoff with max delay of 10 seconds
      const delay = Math.min(times * 1000, 10000);
      return delay;
    }
  });

  // Handle connection events
  connection.on('connect', () => {
    console.log('✅ Connected to Redis (Docker)');
  });

  connection.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
  });

  return connection;
};

// BullMQ queue options
const queueOptions = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: true
  },
  settings: {
    stalledInterval: 30000, // 30 seconds to check stalled jobs
    maxStalledCount: 2      // Retry stalled jobs maximum 2 times
  }
};

module.exports = {
  createRedisConnection,
  queueOptions
};
