/**
 * Job Scheduler
 * 
 * This file sets up scheduled jobs using BullMQ to run at regular intervals.
 * It handles scheduling the news fetching job to run periodically.
 */

const { Queue } = require('bullmq');
const { createRedisConnection, queueOptions } = require('../config/redis.config');

// Create Redis connection
const redisConnection = createRedisConnection();

// Queue for news processing
const newsQueue = new Queue('news', {
  connection: redisConnection,
  ...queueOptions
});

/**
 * Add a news update job to the queue
 * @param {Object} options - Optional job options
 * @returns {Promise<Object>} - The created job
 */
const addNewsUpdateJob = async (options = {}) => {
  console.log('Adding news update job to queue');
  
  const jobOptions = {
    removeOnComplete: true,
    removeOnFail: true, // Remove failed jobs to prevent queue buildup
    attempts: 3,        // Number of retry attempts
    backoff: {
      type: 'exponential',
      delay: 5000       // Initial delay in ms
    },
    ...options
  };
  
  return await newsQueue.add('fetch-news', {}, jobOptions);
};

/**
 * Schedule a recurring job to update news
 * @param {Number} intervalMinutes - Interval in minutes
 * @returns {Promise<Object>} - The created repeatable job
 */
const scheduleNewsUpdate = async (intervalMinutes = 10) => {
  console.log(`Scheduling news update job to run every ${intervalMinutes} minutes`);
  
  // Remove any existing repeatable jobs with the same name
  const repeatableJobs = await newsQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.name === 'fetch-news') {
      await newsQueue.removeRepeatableByKey(job.key);
      console.log(`Removed existing repeatable job: ${job.key}`);
    }
  }
  
  // Add new repeatable job
  return await newsQueue.add(
    'fetch-news',
    {},
    {
      repeat: {
        every: intervalMinutes * 60 * 1000, // Convert minutes to milliseconds
        immediately: true // Run immediately on startup
      },
      removeOnComplete: true,
      removeOnFail: true,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    }
  );
};

/**
 * Initialize the job scheduler
 * @returns {Promise<void>}
 */
const initializeScheduler = async () => {
  try {
    // Schedule news update job to run every 10 minutes
    await scheduleNewsUpdate(10);
    console.log('Job scheduler initialized successfully');
  } catch (error) {
    console.error('Error initializing job scheduler:', error);
    throw error;
  }
};

/**
 * Gracefully shut down the scheduler
 * @returns {Promise<void>}
 */
const shutdownScheduler = async () => {
  try {
    console.log('Shutting down job scheduler...');
    await newsQueue.close();
    console.log('Job scheduler shut down successfully');
  } catch (error) {
    console.error('Error shutting down job scheduler:', error);
  }
};

// Handle process termination gracefully
process.on('SIGTERM', shutdownScheduler);
process.on('SIGINT', shutdownScheduler);

module.exports = {
  initializeScheduler,
  scheduleNewsUpdate,
  addNewsUpdateJob,
  shutdownScheduler
};