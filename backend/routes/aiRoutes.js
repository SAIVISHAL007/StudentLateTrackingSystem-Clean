/**
 * AI Analytics Routes
 * Endpoints for AI-powered insights and predictions
 */

import express from 'express';
import { generateInsights } from '../services/aiPredictor.js';
import { authMiddleware } from './authRoutes.js';

const router = express.Router();

/**
 * @route   GET /api/ai/insights
 * @desc    Get AI-powered insights (predictions, patterns, warnings)
 * @access  Private (Faculty, Admin, SuperAdmin)
 */
router.get('/insights', authMiddleware, async (req, res) => {
  try {
    const insights = await generateInsights();
    
    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI Insights Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI insights',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/ai/health
 * @desc    Check AI service health
 * @access  Private
 */
router.get('/health', authMiddleware, (req, res) => {
  res.json({
    success: true,
    service: 'AI Analytics',
    status: 'operational',
    version: '1.0.0',
    algorithm: 'heuristic-based-risk-scoring',
    timestamp: new Date().toISOString()
  });
});

export default router;
