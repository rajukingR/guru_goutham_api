import express from 'express';
import {
  createGoodsReceipt,
  getAllGoodsReceipts,
  getGoodsReceiptById,
  updateGoodsReceipt,
  deleteGoodsReceipt,
  getApprovedProductSummary
} from '../controllers/goodsReceiptController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', createGoodsReceipt);
router.get('/', getAllGoodsReceipts);
router.get('/approved-receipt-products', getApprovedProductSummary);
router.get('/:id', getGoodsReceiptById);
router.put('/:id', updateGoodsReceipt);
router.delete('/:id', deleteGoodsReceipt);

export default router;
