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

router.post('/create', authMiddleware, createPurchaseQuotation);
router.get('/', authMiddleware, getAllPurchaseQuotations);
router.get('/approved', authMiddleware, getApprovedPurchaseQuotations );
router.get('/:id', authMiddleware, getPurchaseQuotationById);
router.put('/:id', authMiddleware, updatePurchaseQuotation);
router.delete('/:id', authMiddleware, deletePurchaseQuotation);

export default router;
