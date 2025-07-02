import express from 'express';
import {
  createCreditNote,
  getAllCreditNotes,
  getCreditNoteById,
  updateCreditNote,
  deleteCreditNote,
} from '../controllers/CreditNoteController.js';

const router = express.Router();

router.post('/create', createCreditNote);
router.get('/', getAllCreditNotes);
router.get('/:id', getCreditNoteById);
router.put('/update/:id', updateCreditNote);  // ✅ this should work now
router.delete('/:id', deleteCreditNote);

export default router;
