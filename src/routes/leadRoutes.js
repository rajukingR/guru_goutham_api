import express from 'express';
import {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  getAllLeadsActived
} from '../controllers/leadController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', authMiddleware, createLead);
router.get('/', authMiddleware, getAllLeads);
router.get('/active-leads', authMiddleware, getAllLeadsActived);

router.get('/:id', authMiddleware, getLeadById);
router.put('/:id', authMiddleware, updateLead);
router.delete('/:id', authMiddleware, deleteLead);

export default router;
