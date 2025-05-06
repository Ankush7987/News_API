/**
 * News Service
 * 
 * This service handles the business logic for news operations, including:
 * - Fetching news from the database
 * - Triggering news updates
 * - Processing RSS feeds
 */

const News = require('../models/news.model');
const { addNewsUpdateJob } = require('../jobs/queue');

/**
 * Normalize category name to match the enum in the news model
 * @param {String} category - Category name to normalize
 * @returns {String} - Normalized category name
 */
const normalizeCategory = (category) => {
  if (!category) return 'General';
  
  // Map of possible category variations to normalized names
  const categoryMap = {
    'india': 'India',
    'world': 'World',
    'tech': 'Tech',
    'technology': 'Tech',
    'gadgets': 'Tech',
    'politics': 'Politics',
    'business': 'Business',
    'economy': 'Business',
    'finance': 'Business',
    'sports': 'Sports',
    'sport': 'Sports',
    'health': 'Health',
    'healthcare': 'Health',
    'wellness': 'Health',
    'entertainment': 'Entertainment',
    'movies': 'Entertainment',
    'science': 'Science',
    'education': 'Science',
    'other': 'Other',
    'general': 'General'
  };
  
  // Convert to lowercase for case-insensitive matching
  const lowerCategory = category.toLowerCase();
  
  // Return the normalized category or the original with first letter capitalized
  return categoryMap[lowerCategory] || 
         (category.charAt(0).toUpperCase() + category.slice(1));
};

/**
 * Get news with optional category filter
 * @param {String|Array} category - Optional category filter (single category or array of categories)
 * @param {Number} page - Page number for pagination
 * @param {Number} limit - Number of items per page
 * @returns {Promise<Object>} - Object containing news items and total count
 */
const getNews = async (category, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  
  let query = {};
  if (category) {
    if (Array.isArray(category)) {
      // If category is an array, normalize each category and find articles that match any of them
      const normalizedCategories = category.map(cat => normalizeCategory(cat));
      console.log(`Normalized categories for query: ${JSON.stringify(normalizedCategories)}`);
      query = { categories: { $in: normalizedCategories } };
    } else {
      // If category is a string, normalize it and find articles that have that category
      const normalizedCategory = normalizeCategory(category);
      console.log(`Normalized category for query: ${normalizedCategory}`);
      query = { categories: normalizedCategory };
    }
  }
  
  try {
    // Get total count for pagination metadata with timeout
    const totalPromise = News.countDocuments(query).maxTimeMS(5000).exec();
    
    // Get the news items for the current page with timeout
    const resultsPromise = News.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .maxTimeMS(5000)
      .exec();
    
    // Execute both promises in parallel for better performance
    const [totalResults, results] = await Promise.all([totalPromise, resultsPromise]);
      
    return {
      results,
      totalResults
    };
  } catch (error) {
    console.error('MongoDB query error in getNews:', error);
    
    // If it's a timeout error, return a specific error
    if (error.name === 'MongooseError' && error.message.includes('timed out')) {
      throw new Error('Database operation timed out. Please try again later.');
    }
    
    // For server selection errors (connection issues)
    if (error.name === 'MongooseServerSelectionError') {
      throw new Error('Unable to connect to database. Please try again later.');
    }
    
    // Rethrow the original error
    throw error;
  }
};

/**
 * Get latest news items
 * @param {Number} page - Page number for pagination
 * @param {Number} limit - Number of items per page
 * @returns {Promise<Object>} - Object containing news items and total count
 */
const getLatestNews = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  
  try {
    // Get total count for pagination metadata with timeout
    const totalPromise = News.countDocuments({}).maxTimeMS(5000).exec();
    
    // Get the news items for the current page with timeout
    const resultsPromise = News.find({})
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .maxTimeMS(5000)
      .exec();
    
    // Execute both promises in parallel for better performance
    const [totalResults, results] = await Promise.all([totalPromise, resultsPromise]);
      
    return {
      results,
      totalResults
    };
  } catch (error) {
    console.error('MongoDB query error in getLatestNews:', error);
    
    // If it's a timeout error, return a specific error
    if (error.name === 'MongooseError' && error.message.includes('timed out')) {
      throw new Error('Database operation timed out. Please try again later.');
    }
    
    // For server selection errors (connection issues)
    if (error.name === 'MongooseServerSelectionError') {
      throw new Error('Unable to connect to database. Please try again later.');
    }
    
    // Rethrow the original error
    throw error;
  }
};

/**
 * Trigger a manual news update
 * @returns {Promise<void>}
 */
const triggerNewsUpdate = async () => {
  // Add a job to the queue to update news
  await addNewsUpdateJob();
};

module.exports = {
  getNews,
  getLatestNews,
  triggerNewsUpdate
};