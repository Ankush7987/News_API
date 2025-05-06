/**
 * News Controller
 * 
 * This controller handles all news-related API requests, including:
 * - Getting news by category
 * - Getting latest news
 * - Manually triggering news updates
 */

const newsService = require('../services/news.service');

// Simple in-memory cache to serve as fallback when database is unavailable
const fallbackCache = new Map();
const FALLBACK_CACHE_TTL = 30 * 60 * 1000; // 30 minutes TTL for fallback cache

/**
 * Get news with optional category filter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getNews = async (req, res) => {
  try {
    let categories = req.query.category;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Create a cache key for this request
    const cacheKey = `news-${JSON.stringify(categories)}-${page}-${limit}`;
    
    // Handle multiple categories (comma-separated or array format)
    if (categories && typeof categories === 'string' && categories.includes(',')) {
      categories = categories.split(',').map(cat => cat.trim());
    }
    
    // Debug log for category filtering
    console.log(`Filtering news by categories: ${JSON.stringify(categories)}`);
    
    try {
      // Try to get data from the database
      const { results, totalResults } = await newsService.getNews(categories, page, limit);
      
      // If successful, update the fallback cache
      fallbackCache.set(cacheKey, {
        data: { results, totalResults },
        expiry: Date.now() + FALLBACK_CACHE_TTL
      });
      
      // Debug log for results
      console.log(`Found ${totalResults} results for categories: ${JSON.stringify(categories)}`);
      const totalPages = Math.ceil(totalResults / limit);
      
      res.status(200).json({
        status: 'success',
        currentPage: page,
        totalPages,
        totalResults,
        results
      });
    } catch (error) {
      console.error('Error fetching news from database:', error);
      
      // Try to use fallback cache if available and database operation failed
      const cachedResponse = fallbackCache.get(cacheKey);
      if (cachedResponse && cachedResponse.expiry > Date.now()) {
        console.log(`Using fallback cache for query: ${cacheKey}`);
        const { results, totalResults } = cachedResponse.data;
        const totalPages = Math.ceil(totalResults / limit);
        
        // Return cached data with a warning
        return res.status(200).json({
          status: 'success',
          warning: 'Using cached data due to database issues',
          currentPage: page,
          totalPages,
          totalResults,
          results
        });
      }
      
      // If no cache is available, return an error
      res.status(503).json({
        status: 'error',
        message: 'Database service is currently unavailable. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    console.error('Unexpected error in getNews controller:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch news',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get latest news items
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getLatestNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Create a cache key for this request
    const cacheKey = `latest-${page}-${limit}`;
    
    try {
      // Try to get data from the database
      const { results, totalResults } = await newsService.getLatestNews(page, limit);
      
      // If successful, update the fallback cache
      fallbackCache.set(cacheKey, {
        data: { results, totalResults },
        expiry: Date.now() + FALLBACK_CACHE_TTL
      });
      
      const totalPages = Math.ceil(totalResults / limit);
      
      res.status(200).json({
        status: 'success',
        currentPage: page,
        totalPages,
        totalResults,
        results
      });
    } catch (error) {
      console.error('Error fetching latest news from database:', error);
      
      // Try to use fallback cache if available and database operation failed
      const cachedResponse = fallbackCache.get(cacheKey);
      if (cachedResponse && cachedResponse.expiry > Date.now()) {
        console.log(`Using fallback cache for query: ${cacheKey}`);
        const { results, totalResults } = cachedResponse.data;
        const totalPages = Math.ceil(totalResults / limit);
        
        // Return cached data with a warning
        return res.status(200).json({
          status: 'success',
          warning: 'Using cached data due to database issues',
          currentPage: page,
          totalPages,
          totalResults,
          results
        });
      }
      
      // If no cache is available, return an error
      res.status(503).json({
        status: 'error',
        message: 'Database service is currently unavailable. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    console.error('Unexpected error in getLatestNews controller:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch latest news',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Manually trigger news update
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateNews = async (req, res) => {
  try {
    await newsService.triggerNewsUpdate();
    
    res.status(200).json({
      status: 'success',
      message: 'News update triggered successfully'
    });
  } catch (error) {
    console.error('Error triggering news update:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to trigger news update',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getNews,
  getLatestNews,
  updateNews
};