/**
 * Worker System
 * 
 * This file sets up the BullMQ worker to process jobs from the news queue.
 * It handles job processing with robust error handling and retry logic.
 */

const { Worker } = require('bullmq');
const { createRedisConnection } = require('../config/redis.config');
const newsProcessor = require('./newsProcessor');

// Create Redis connection
const redisConnection = createRedisConnection();

/**
 * Initialize the news queue worker
 * @param {Function} processor - The job processor function
 * @param {Object} options - Optional worker options
 * @returns {Worker} - The created worker
 */
const createNewsWorker = (processor, options = {}) => {
  if (typeof processor !== 'function') {
    throw new Error('Job processor must be a function');
  }

  const workerOptions = {
    connection: redisConnection,
    concurrency: 1,      // Process one job at a time by default
    lockDuration: 60000, // 60 seconds lock to prevent job stalling
    lockRenewTime: 30000, // Renew lock every 30 seconds
    ...options
  };

  // Create worker to process jobs
  const worker = new Worker('news', async (job) => {
    console.log(`Processing job ${job.id}: ${job.name}`);
    
    try {
      // Update progress to 10% - starting job
      await job.updateProgress(10);
      
      // Process the job using the provided processor function
      const result = await processor(job);
      
      // Update progress to 100% - job complete
      await job.updateProgress(100);
      
      console.log(`Job ${job.id} completed successfully`);
      return result;
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      throw error; // Rethrow to trigger retry mechanism
    }
  }, workerOptions);
  
  // Handle worker events for detailed monitoring
  worker.on('completed', (job) => {
    console.log(`Job ${job.id} has been completed`);
  });
  
  worker.on('failed', (job, error) => {
    console.error(`Job ${job.id} has failed with error:`, error);
  });
  
  worker.on('stalled', (jobId) => {
    console.warn(`Job ${jobId} has stalled and will be reprocessed`);
  });
  
  worker.on('error', (error) => {
    console.error('Worker error:', error);
  });

  return worker;
};

/**
 * Example usage:
 * 
 * const worker = createNewsWorker(async (job) => {
 *   // Process job data
 *   const { data } = job;
 *   
 *   // Perform some work
 *   // ...
 *   
 *   // Return result
 *   return { success: true, data: 'processed data' };
 * });
 */

/**
 * Initialize the news worker with the news processor
 * @returns {Worker} - The created worker
 */
const initializeWorker = () => {
  console.log('Initializing news worker...');
  const worker = createNewsWorker(newsProcessor, {
    concurrency: 1 // Process one job at a time
  });
  console.log('News worker initialized successfully');
  return worker;
};

/**
 * Gracefully shut down a worker
 * @param {Worker} worker - The worker to shut down
 * @returns {Promise<void>}
 */
const shutdownWorker = async (worker) => {
  if (worker) {
    console.log('Shutting down worker...');
    await worker.close();
    console.log('Worker shut down successfully');
  }
};

module.exports = {
  createNewsWorker,
  initializeWorker,
  shutdownWorker
};