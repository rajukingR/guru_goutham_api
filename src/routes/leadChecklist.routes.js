// File: src/routes/leadChecklist.routes.js
import express from 'express';
import {
  createLeadChecklist,
  getAllLeadChecklists,
  getLeadChecklistById,
  updateLeadChecklist,
  deleteLeadChecklist
} from '../controllers/leadChecklistController.js';

const router = express.Router();

// POST /api/lead-checklists - Create new checklist
router.post('/create', createLeadChecklist);

// GET /api/lead-checklists - Get all checklists
router.get('/', getAllLeadChecklists);

// GET /api/lead-checklists/:id - Get single checklist
router.get('/:id', getLeadChecklistById);

// PUT /api/lead-checklists/:id - Update checklist
router.put('/:id', updateLeadChecklist);

// DELETE /api/lead-checklists/:id - Delete checklist
router.delete('/:id', deleteLeadChecklist);

export default router;