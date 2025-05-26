import express from 'express';
import {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier
} from '../controllers/SupplierController.js';

const router = express.Router();

router.post('/create', createSupplier);
router.get('/', getAllSuppliers);
router.get('/:id', getSupplierById);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
