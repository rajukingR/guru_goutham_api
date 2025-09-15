import express from 'express';
import {
  createPurchaseRequest,
  getAllPurchaseRequests,
  getPurchaseRequestById,
  updatePurchaseRequest,
  deletePurchaseRequest,
  getApprovedPurchaseRequests,
} from '../controllers/purchaseRequestsController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', authMiddleware, createPurchaseRequest);
router.get('/', authMiddleware, getAllPurchaseRequests);
router.get('/approved', authMiddleware, getApprovedPurchaseRequests);

router.get('/:id', authMiddleware, getPurchaseRequestById);
router.put('/:id', authMiddleware, updatePurchaseRequest);
router.delete('/:id', authMiddleware, deletePurchaseRequest);

export default router;
