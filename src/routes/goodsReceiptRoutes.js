import express from 'express';
import {
  createGoodsReceipt,
  getAllGoodsReceipts,
  getGoodsReceiptById,
  updateGoodsReceipt,
  deleteGoodsReceipt,
  getApprovedProductSummary,
  getApprovedProductSummary1,
  getApprovedProductSummaryDashboard
} from '../controllers/goodsReceiptController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', authMiddleware, createGoodsReceipt);
router.get('/', authMiddleware, getAllGoodsReceipts);
router.get('/approved-receipt-products', authMiddleware, getApprovedProductSummary);
router.get('/approved-receipt-products/list', authMiddleware, getApprovedProductSummary1);

router.get('/approved-receipt-products/dashboard', authMiddleware, getApprovedProductSummaryDashboard);

router.get('/:id', authMiddleware, getGoodsReceiptById);
router.put('/:id', authMiddleware, updateGoodsReceipt);
router.delete('/:id', authMiddleware, deleteGoodsReceipt);

export default router;
