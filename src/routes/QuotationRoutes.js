import express from 'express';
import {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation
} from '../controllers/quotationController.js';

const router = express.Router();

router.post('/create', createQuotation);
router.get('/', getAllQuotations);
router.get('/:id', getQuotationById);
router.put('/:id', updateQuotation);
router.delete('/:id', deleteQuotation);

export default router;
