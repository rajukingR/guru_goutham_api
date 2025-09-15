import express from 'express';
import {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  getAllQuotationsApproved
} from '../controllers/quotationController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', authMiddleware, createQuotation);
router.get('/', authMiddleware, getAllQuotations);
router.get('/approved', authMiddleware, getAllQuotationsApproved);
router.get('/:id', authMiddleware, getQuotationById);
router.put('/:id', authMiddleware, updateQuotation);
router.delete('/:id', authMiddleware, deleteQuotation);

export default router;
