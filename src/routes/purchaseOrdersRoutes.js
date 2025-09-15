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

router.post('/create', authMiddleware, createPurchaseOrder);
router.get('/', authMiddleware, getAllPurchaseOrders);
router.get('/approved', authMiddleware, getApprovedPurchaseOrders);
router.get('/:id', authMiddleware, getPurchaseOrderById);
router.put('/:id', authMiddleware, updatePurchaseOrder);
router.delete('/:id', authMiddleware, deletePurchaseOrder);

export default router;
