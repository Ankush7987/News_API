/**
 * News Controller
 * 
 * This controller handles all news-related API requests, including:
 * - Getting news by category
 * - Getting latest news
 * - Manually triggering news updates
 */

const newsService = require('../services/news.service');

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
    
    // Handle multiple categories (comma-separated or array format)
    if (categories && typeof categories === 'string' && categories.includes(',')) {
      categories = categories.split(',').map(cat => cat.trim());
    }
    
    // Debug log for category filtering
    console.log(`Filtering news by categories: ${JSON.stringify(categories)}`);
    
    const { results, totalResults } = await newsService.getNews(categories, page, limit);
    
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
    console.error('Error fetching news:', error);
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
    
    const { results, totalResults } = await newsService.getLatestNews(page, limit);
    const totalPages = Math.ceil(totalResults / limit);
    
    res.status(200).json({
      status: 'success',
      currentPage: page,
      totalPages,
      totalResults,
      results
    });
  } catch (error) {
    console.error('Error fetching latest news:', error);
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