import express from 'express';
import {
  createPurchaseQuotation,
  getAllPurchaseQuotations,
  getPurchaseQuotationById,
  updatePurchaseQuotation,
  deletePurchaseQuotation
} from '../controllers/PurchaseQuotationController.js';

const router = express.Router();

router.post('/create', createPurchaseQuotation);
router.get('/', getAllPurchaseQuotations);
router.get('/:id', getPurchaseQuotationById);
router.put('/:id', updatePurchaseQuotation);
router.delete('/:id', deletePurchaseQuotation);

export default router;
