// routes/taxListRoutes.js

import express from 'express';
import {
  createTax,
  getAllTaxes,
  getTaxById,
  updateTax,
  deleteTax
} from '../controllers/TaxListController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', authMiddleware, createTax);
router.get('/', authMiddleware, getAllTaxes);
router.get('/:id', authMiddleware, getTaxById);
router.put('/:id', authMiddleware, updateTax);
router.delete('/:id', authMiddleware, deleteTax);

export default router;
