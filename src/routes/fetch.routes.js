/**
 * Fetch News API Routes
 * 
 * This file defines the route for manually triggering news fetching.
 * It provides an endpoint for administrators to manually trigger the news update process.
 */

const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const { addNewsUpdateJob } = require('../jobs/jobScheduler');

/**
 * @route   POST /api/news/fetch
 * @desc    Manually trigger news fetching
 * @access  Admin
 */
router.post('/news/fetch', authenticateAdmin, async (req, res) => {
  try {
    // Add a job to the queue to fetch news
    const job = await addNewsUpdateJob();
    
    res.status(200).json({
      status: 'success',
      message: 'News fetch job added to queue',
      jobId: job.id
    });
  } catch (error) {
    console.error('Error triggering news fetch:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to trigger news fetch',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;