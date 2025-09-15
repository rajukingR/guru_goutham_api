import express from 'express';
import {
  createTaxType,
  getAllTaxTypes,
  getTaxTypeById,
  updateTaxType,
  deleteTaxType,
} from '../controllers/taxTypeController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', authMiddleware, createTaxType);
router.get('/', authMiddleware, getAllTaxTypes);
router.get('/:id', authMiddleware, getTaxTypeById);
router.put('/:id', authMiddleware, updateTaxType);
router.delete('/:id', authMiddleware, deleteTaxType);

export default router;
