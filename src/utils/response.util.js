/**
 * Response Utilities
 * 
 * This file contains utility functions for handling API responses and errors.
 */

/**
 * Format a success response
 * @param {Object} data - The data to include in the response
 * @param {String} message - Optional success message
 * @returns {Object} - Formatted success response
 */
const successResponse = (data, message = 'Operation successful') => {
  return {
    status: 'success',
    message,
    data
  };
};

/**
 * Format an error response
 * @param {String} message - Error message
 * @param {Error} error - Optional error object
 * @param {Number} statusCode - HTTP status code
 * @returns {Object} - Formatted error response
 */
const errorResponse = (message, error = null, statusCode = 500) => {
  const response = {
    status: 'error',
    message
  };
  
  // Include error details in development environment
  if (error && process.env.NODE_ENV === 'development') {
    response.error = error.message;
    response.stack = error.stack;
  }
  
  return response;
};

/**
 * Handle API errors consistently
 * @param {Error} error - The error object
 * @param {Object} res - Express response object
 * @param {String} message - Custom error message
 * @param {Number} statusCode - HTTP status code
 */
const handleApiError = (error, res, message = 'An error occurred', statusCode = 500) => {
  console.error(`API Error: ${message}`, error);
  res.status(statusCode).json(errorResponse(message, error, statusCode));
};

module.exports = {
  successResponse,
  errorResponse,
  handleApiError
};