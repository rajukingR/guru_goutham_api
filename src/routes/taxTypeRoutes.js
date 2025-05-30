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

router.post('/create', createTaxType);
router.get('/', getAllTaxTypes);
router.get('/:id', getTaxTypeById);
router.put('/:id', updateTaxType);
router.delete('/:id', deleteTaxType);

export default router;
