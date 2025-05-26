import express from 'express';
import {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  deletePurchaseOrder
} from '../controllers/purchaseOrdersController.js';

const router = express.Router();

router.post('/create', createPurchaseOrder);
router.get('/', getAllPurchaseOrders);
router.get('/:id', getPurchaseOrderById);
router.delete('/:id', deletePurchaseOrder);

export default router;
