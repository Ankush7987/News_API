/**
 * Queue System
 * 
 * This file sets up the BullMQ queue system for background jobs.
 * It creates and exports a BullMQ queue called 'newsQueue' for processing news-related jobs.
 */

const { Queue, QueueEvents } = require('bullmq');
const { createRedisConnection, queueOptions } = require('../config/redis.config');

// Create Redis connection
const redisConnection = createRedisConnection();

// Queue for news processing
const newsQueue = new Queue('news', {
  connection: redisConnection,
  ...queueOptions
});

// Queue events for monitoring
const queueEvents = new QueueEvents('news', {
  connection: redisConnection
});

// Set up queue event listeners
queueEvents.on('completed', ({ jobId }) => {
  console.log(`Job ${jobId} has been completed successfully`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`Job ${jobId} has failed with reason: ${failedReason}`);
});

queueEvents.on('stalled', ({ jobId }) => {
  console.warn(`Job ${jobId} has been stalled - will be automatically retried`);
});

/**
 * Add a job to the news queue
 * @param {String} name - Job name
 * @param {Object} data - Job data
 * @param {Object} options - Optional job options
 * @returns {Promise<Object>} - The created job
 */
const addJob = async (name, data = {}, options = {}) => {
  const jobOptions = {
    removeOnComplete: true,
    removeOnFail: true, // Remove failed jobs to prevent queue buildup
    attempts: 3,        // Number of retry attempts
    backoff: {          // Exponential backoff strategy
      type: 'exponential',
      delay: 5000       // Initial delay in ms
    },
    ...options          // Allow overriding defaults
  };
  
  return await newsQueue.add(name, data, jobOptions);
};

/**
 * Setup queues and event listeners
 */
const setupQueues = () => {
  console.log('News queue initialized');
  
  // Handle process termination gracefully
  const gracefulShutdown = async () => {
    console.log('Closing queue connections...');
    try {
      await queueEvents.close();
      await newsQueue.close();
      console.log('Queue connections closed successfully');
    } catch (error) {
      console.error('Error during queue shutdown:', error);
    }
  };
  
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
};

/**
 * Add a news update job to the queue
 * @param {Object} options - Optional job options
 * @returns {Promise<Object>} - The created job
 */
const addNewsUpdateJob = async (options = {}) => {
  return await addJob('fetch-news', {}, options);
};

module.exports = {
  setupQueues,
  addJob,
  addNewsUpdateJob,
  newsQueue
};