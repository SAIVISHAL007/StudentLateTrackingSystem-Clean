/**
 * Central Error Handler Middleware
 * Formats all errors consistently and provides safe error messages to clients
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    error = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field} already exists`;
    error = new AppError(message, 409, 'DUPLICATE_ERROR');
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new AppError(message, 400, 'INVALID_ID');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Rate limit errors
  if (err.name === 'TooManyRequests') {
    error = new AppError('Too many requests, please try again later', 429, 'RATE_LIMIT_EXCEEDED');
  }

  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  
  // Log error for debugging
  if (statusCode >= 500) {
    console.error('❌ Server Error:', {
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      correlationId: req.correlationId
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: code,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
};

// Async route wrapper to catch errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export { errorHandler, asyncHandler, AppError };
