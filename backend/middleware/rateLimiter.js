/**
 * Rate limiting middleware for authentication and student operations
 */

import rateLimit from 'express-rate-limit';

// Auth endpoints rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 10, // 10 requests per window
  message: {
    success: false,
    error: {
      message: 'Too many login attempts, please try again later',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many login attempts from this IP, please try again after 15 minutes',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
      }
    });
  }
});

// Student operations rate limiter (moderate)
export const studentOperationsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_STUDENT_OPS_MAX) || 30, // 30 requests per minute
  message: {
    success: false,
    error: {
      message: 'Too many requests, please slow down',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_API_MAX) || 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false
});
