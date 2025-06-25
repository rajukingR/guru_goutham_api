// routes/leadStatusRoutes.js

import express from 'express';
import {
  createLeadStatus,
  getAllLeadStatus,
  getLeadStatusById,
  updateLeadStatus,
  deleteLeadStatus,
} from '../controllers/leadStatusController.js';

const router = express.Router();

// Attach model middleware to req.models
router.use(async (req, res, next) => {
  try {
    const models = (await import('../models/index.js')).default;
    req.models = models;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Failed to load models', details: err.message });
  }
});

// Routes
router.post('/create', createLeadStatus);
router.get('/', getAllLeadStatus);
router.get('/:id', getLeadStatusById);
router.put('/:id', updateLeadStatus);
router.delete('/:id', deleteLeadStatus);

export default router;
