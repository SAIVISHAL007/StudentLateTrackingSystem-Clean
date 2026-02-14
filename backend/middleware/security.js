/**
 * Security middleware for production environment
 */

// Force HTTPS in production
export const forceHTTPS = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    // Check if request is not secure
    if (req.headers['x-forwarded-proto'] !== 'https' && !req.secure) {
      return res.status(403).json({ 
        error: 'HTTPS Required',
        message: 'Please use HTTPS to access this resource'
      });
    }
  }
  next();
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (restrict inline scripts)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;"
    );
  }
  
  // HSTS - Force HTTPS for future requests (1 year)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
};

// Sanitize error messages in production (don't leak internal details)
export const sanitizeErrors = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    // Log full error server-side
    console.error('Production Error:', {
      message: err.message,
      stack: process.env.DEBUG === 'true' ? err.stack : undefined,
      url: req.url,
      method: req.method,
      ip: req.ip
    });
    
    // Send generic error to client
    return res.status(err.status || 500).json({
      error: 'An error occurred',
      message: err.status === 400 || err.status === 401 || err.status === 403 || err.status === 404 
        ? err.message 
        : 'Internal server error. Please try again later.'
    });
  }
  
  // Development mode - send full error details
  next(err);
};

// Request sanitization - remove sensitive data from logs
export const sanitizeRequest = (req, res, next) => {
  // Create safe log object without sensitive data
  const safePath = req.path;
  const safeMethod = req.method;
  const safeIP = req.ip;
  
  // Don't log password or token in body/query
  if (req.body && typeof req.body === 'object') {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '[REDACTED]';
    if (safeBody.newPassword) safeBody.newPassword = '[REDACTED]';
    if (safeBody.oldPassword) safeBody.oldPassword = '[REDACTED]';
    if (safeBody.token) safeBody.token = '[REDACTED]';
    req.safeBody = safeBody;
  }
  
  next();
};

export default {
  forceHTTPS,
  securityHeaders,
  sanitizeErrors,
  sanitizeRequest
};
