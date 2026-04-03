import express from 'express';
import {
  createSupplier,
  getAllSuppliers,
  getAllSuppliers1,
  getSupplierById,
  updateSupplier,
  deleteSupplier
} from '../controllers/SupplierController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', authMiddleware, createSupplier);
router.get('/', authMiddleware, getAllSuppliers);
router.get('/list', authMiddleware, getAllSuppliers1);

router.get('/:id', authMiddleware, getSupplierById);
router.put('/:id', authMiddleware, updateSupplier);
router.delete('/:id', authMiddleware, deleteSupplier);

export default router;
