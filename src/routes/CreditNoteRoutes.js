import express from 'express';
import {
  createCreditNote,
  getAllCreditNotes,
  getCreditNoteById,
  updateCreditNote,
  deleteCreditNote,
} from '../controllers/CreditNoteController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', authMiddleware, createCreditNote);
router.get('/', authMiddleware, getAllCreditNotes);
router.get('/:id', authMiddleware, getCreditNoteById);
router.put('/:id', authMiddleware, updateCreditNote);  // ✅ this should work now
router.delete('/:id', authMiddleware, deleteCreditNote);

export default router;
