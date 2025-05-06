/**
 * News API Routes
 * 
 * This file defines all the routes for the News API, including:
 * - Getting news by category
 * - Getting latest news
 * - Manually triggering news updates (admin protected)
 */

const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news.controller');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/news
 * @desc    Get news with optional category filter
 * @access  Public
 */
router.get('/news', newsController.getNews);

/**
 * @route   GET /api/news/latest
 * @desc    Get latest 50 news items
 * @access  Public
 */
router.get('/news/latest', newsController.getLatestNews);

/**
 * @route   POST /api/update-news
 * @desc    Manually trigger news update
 * @access  Admin
 */
router.post('/update-news', authenticateAdmin, newsController.updateNews);

module.exports = router;