/**
 * Request validation schemas using Joi
 */

import Joi from 'joi';
import { AppError } from '../middleware/errorHandler.js';

// Validation middleware wrapper
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(errorMessage, 400, 'VALIDATION_ERROR'));
    }
    
    req.body = value;
    next();
  };
};

// Auth schemas
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required'
  })
});

export const registerFacultySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  department: Joi.string().optional(),
  role: Joi.string().valid('admin', 'faculty', 'viewer').default('faculty')
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

// Student operations schemas
export const markLateSchema = Joi.object({
  rollNo: Joi.string().required().messages({
    'any.required': 'Roll number is required'
  }),
  photo: Joi.string().optional(),
  reason: Joi.string().optional()
});

export const createStudentSchema = Joi.object({
  rollNo: Joi.string().required().uppercase(),
  name: Joi.string().min(2).max(100).required(),
  year: Joi.number().integer().min(1).max(4).required(),
  semester: Joi.number().integer().min(1).max(8).required(),
  branch: Joi.string().required().uppercase(),
  section: Joi.string().required().uppercase(),
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).optional()
});

export const singleRemovalSchema = Joi.object({
  rollNo: Joi.string().required(),
  date: Joi.date().iso().required(),
  reason: Joi.string().min(10).required().messages({
    'string.min': 'Reason must be at least 10 characters'
  }),
  authorizedBy: Joi.string().required()
});

export const bulkRemovalSchema = Joi.object({
  records: Joi.array().items(
    Joi.object({
      rollNo: Joi.string().required(),
      date: Joi.date().iso().required()
    })
  ).min(1).required(),
  reason: Joi.string().min(10).required(),
  authorizedBy: Joi.string().required()
});

export const promoteSemesterSchema = Joi.object({
  specificYear: Joi.number().integer().min(1).max(4).optional().allow(null),
  specificBranch: Joi.string().optional().allow(null),
  graduateYear4Sem8: Joi.boolean().default(true)
});

export const updateStudentSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  year: Joi.number().integer().min(1).max(4).optional(),
  semester: Joi.number().integer().min(1).max(8).optional(),
  branch: Joi.string().uppercase().optional(),
  section: Joi.string().uppercase().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
  status: Joi.string().valid('normal', 'approaching_limit', 'excused', 'fined', 'alert', 'graduated').optional()
});
