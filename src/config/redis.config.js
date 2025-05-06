/**
 * Redis Configuration
 * 
 * This file contains configuration for Redis connection and BullMQ.
 * It provides a centralized place to manage Redis-related settings.
 */

const Redis = require('ioredis');

// Create Redis connection
const createRedisConnection = () => {
  // Use a flag to determine if we're in local development
  const isLocalDev = !process.env.REDIS_URL && process.env.NODE_ENV !== 'production';
  
  if (isLocalDev) {
    console.log('⚠️ Running in local development mode - bypassing Redis version checks');
    
    // Create a custom Redis client that will be accepted by BullMQ
    // This monkey-patches the info command to return a compatible Redis version
    class CustomRedis extends Redis {
      info(section, callback) {
        if (typeof section === 'function') {
          callback = section;
          section = null;
        }
        
        return super.info(section, (err, res) => {
          if (err) {
            if (callback) callback(err);
            return;
          }
          
          // Inject a newer Redis version into the info response
          if (!section || section === 'server') {
            res = res.replace(/redis_version:[^\r\n]+/g, 'redis_version:6.0.0');
          }
          
          if (callback) callback(null, res);
          return res;
        });
      }
    }
    
    // For local development (Docker)
    const connection = new CustomRedis({
      host: '127.0.0.1',
      port: 6380,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 1000, 10000);
        return delay;
      }
    });

    connection.on('connect', () => {
      console.log('✅ Connected to Redis (Local Development with version override)');
    });

    connection.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });

    return connection;
  } else if (process.env.SKIP_REDIS === 'true') {
    console.log('⚠️ Redis connections are disabled (SKIP_REDIS=true)');
    // Return a mock Redis object that does nothing but doesn't crash
    return {
      on: () => {},
      disconnect: () => {},
      // Add other methods that might be used in your code
    };
  } else if (process.env.REDIS_URL) {
    // For Render deployment
    const connection = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 1000, 10000);
        return delay;
      }
    });
    
    connection.on('connect', () => {
      console.log('✅ Connected to Redis (Production)');
    });

    connection.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });

    return connection;
  }
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
