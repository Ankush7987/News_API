/**
 * Authentication Middleware
 * 
 * This middleware provides authentication for protected routes.
 * Currently, it only implements admin authentication using a token.
 */

/**
 * Middleware to authenticate admin requests
 * Verifies the admin token from request headers against the one in environment variables
 */
const authenticateAdmin = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  
  if (!token) {
    return res.status(401).json({ 
      status: 'error', 
      message: 'Access denied. No token provided.' 
    });
  }
  
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Invalid token.' 
    });
  }
  
  next();
};

module.exports = {
  authenticateAdmin
};