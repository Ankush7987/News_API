/**
 * Redis Cache Utility
 * 
 * This utility provides Redis-based caching functions for API responses
 * to improve performance and reduce database load.
 */

const { createRedisConnection } = require('../config/redis.config');

// Create Redis client
const redisClient = createRedisConnection();

// Default cache expiration time (5 minutes)
const DEFAULT_CACHE_EXPIRATION = 5 * 60; // 5 minutes in seconds

/**
 * Set data in Redis cache with expiration
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 * @param {number} expiration - Cache expiration in seconds (default: 5 minutes)
 * @returns {Promise<boolean>} - Success status
 */
const setCache = async (key, data, expiration = DEFAULT_CACHE_EXPIRATION) => {
  try {
    // Skip if Redis is not available
    if (!redisClient || typeof redisClient.set !== 'function') {
      console.log('Redis not available, skipping cache set');
      return false;
    }

    // Store data as JSON string with expiration
    await redisClient.set(key, JSON.stringify(data), 'EX', expiration);
    console.log(`Cache set for key: ${key} with ${expiration}s expiration`);
    return true;
  } catch (error) {
    console.error('Error setting cache:', error);
    return false;
  }
};

/**
 * Get data from Redis cache
 * @param {string} key - Cache key
 * @returns {Promise<Object|null>} - Cached data or null if not found/error
 */
const getCache = async (key) => {
  try {
    // Skip if Redis is not available
    if (!redisClient || typeof redisClient.get !== 'function') {
      console.log('Redis not available, skipping cache get');
      return null;
    }

    // Get data from Redis
    const cachedData = await redisClient.get(key);
    
    if (!cachedData) {
      console.log(`Cache miss for key: ${key}`);
      return null;
    }
    
    console.log(`Cache hit for key: ${key}`);
    return JSON.parse(cachedData);
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
};

/**
 * Delete a specific key from Redis cache
 * @param {string} key - Cache key to delete
 * @returns {Promise<boolean>} - Success status
 */
const deleteCache = async (key) => {
  try {
    // Skip if Redis is not available
    if (!redisClient || typeof redisClient.del !== 'function') {
      console.log('Redis not available, skipping cache delete');
      return false;
    }

    await redisClient.del(key);
    console.log(`Cache deleted for key: ${key}`);
    return true;
  } catch (error) {
    console.error('Error deleting cache:', error);
    return false;
  }
};

/**
 * Clear all cache keys matching a pattern
 * @param {string} pattern - Pattern to match keys (e.g., 'news:*')
 * @returns {Promise<boolean>} - Success status
 */
const clearCachePattern = async (pattern) => {
  try {
    // Skip if Redis is not available
    if (!redisClient || typeof redisClient.scan !== 'function') {
      console.log('Redis not available, skipping pattern cache clear');
      return false;
    }

    let cursor = '0';
    do {
      const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      
      if (keys.length > 0) {
        await redisClient.del(...keys);
        console.log(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
      }
    } while (cursor !== '0');
    
    return true;
  } catch (error) {
    console.error('Error clearing cache pattern:', error);
    return false;
  }
};

module.exports = {
  setCache,
  getCache,
  deleteCache,
  clearCachePattern,
  DEFAULT_CACHE_EXPIRATION
};