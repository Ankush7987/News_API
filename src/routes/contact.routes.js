const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');

// POST endpoint for contact form submissions
// This route is now accessible at /api/contact
router.post('/', (req, res, next) => {
  console.log('Contact form submission received:', req.body);
  contactController.submitContactForm(req, res, next);
});

module.exports = router;