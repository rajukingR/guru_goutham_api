import express from 'express';
import {
  createPurchaseQuotation,
  getAllPurchaseQuotations,
  getPurchaseQuotationById,
  updatePurchaseQuotation,
  deletePurchaseQuotation,
  getApprovedPurchaseQuotations
} from '../controllers/PurchaseQuotationController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', createPurchaseQuotation);
router.get('/', getAllPurchaseQuotations);
router.get('/approved', getApprovedPurchaseQuotations );
router.get('/:id', getPurchaseQuotationById);
router.put('/:id', updatePurchaseQuotation);
router.delete('/:id', deletePurchaseQuotation);

export default router;
