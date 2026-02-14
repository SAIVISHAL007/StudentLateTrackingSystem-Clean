/**
 * Simple structured logger with correlation IDs
 * Logs all requests with unique correlation ID for tracing
 * SECURITY: Does not log sensitive data (passwords, tokens, etc.)
 */

import { randomUUID } from 'crypto';

// Sanitize sensitive fields from objects before logging
const sanitizeForLog = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = { ...obj };
  const sensitiveFields = ['password', 'newPassword', 'oldPassword', 'token', 'jwt', 'authorization', 'plaintextPassword'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...sanitizeForLog(meta)
    }));
  },
  
  error: (message, meta = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      ...sanitizeForLog(meta)
    }));
  },
  
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      timestamp: new Date().toISOString(),
      message,
      ...sanitizeForLog(meta)
    }));
  }
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || randomUUID();
  req.correlationId = correlationId;
  
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };
    
    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });
  
  next();
};

export { logger, requestLogger, sanitizeForLog };
