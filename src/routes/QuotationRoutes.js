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

router.post('/create', createQuotation);
router.get('/', getAllQuotations);
router.get('/approved', getAllQuotationsApproved);
router.get('/:id', getQuotationById);
router.put('/:id', updateQuotation);
router.delete('/:id', deleteQuotation);

export default router;
