import express from 'express';
import {
  createGoodsReceipt,
  getAllGoodsReceipts,
  getGoodsReceiptById,
  updateGoodsReceipt,
  deleteGoodsReceipt
} from '../controllers/goodsReceiptController.js';

const router = express.Router();

router.post('/create', createGoodsReceipt);
router.get('/', getAllGoodsReceipts);
router.get('/:id', getGoodsReceiptById);
router.put('/:id', updateGoodsReceipt);
router.delete('/:id', deleteGoodsReceipt);

export default router;
