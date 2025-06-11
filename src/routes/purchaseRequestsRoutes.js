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

router.post('/create', createPurchaseRequest);
router.get('/', getAllPurchaseRequests);
router.get('/approved', getApprovedPurchaseRequests);

router.get('/:id', getPurchaseRequestById);
router.put('/:id', updatePurchaseRequest);
router.delete('/:id', deletePurchaseRequest);

export default router;
