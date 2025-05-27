import express from 'express';
import {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead
} from '../controllers/leadController.js';

const router = express.Router();

router.post('/create', createLead);
router.get('/', getAllLeads);
router.get('/:id', getLeadById);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

export default router;
