import express from 'express';
import {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  deletePurchaseOrder,
  updatePurchaseOrder,
  getApprovedPurchaseOrders
} from '../controllers/purchaseOrdersController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', createPurchaseOrder);
router.get('/', getAllPurchaseOrders);
router.get('/approved', getApprovedPurchaseOrders);
router.get('/:id', getPurchaseOrderById);
router.put('/:id', updatePurchaseOrder);
router.delete('/:id', deletePurchaseOrder);

export default router;
