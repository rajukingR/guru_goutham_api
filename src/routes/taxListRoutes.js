// routes/taxListRoutes.js

import express from 'express';
import {
  createTax,
  getAllTaxes,
  getTaxById,
  updateTax,
  deleteTax
} from '../controllers/TaxListController.js';

const router = express.Router();

router.post('/create', createTax);
router.get('/', getAllTaxes);
router.get('/:id', getTaxById);
router.put('/:id', updateTax);
router.delete('/:id', deleteTax);

export default router;
