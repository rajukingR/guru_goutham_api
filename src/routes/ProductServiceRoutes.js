import express from 'express';
import {
  createProductService,
  getAllProductServices,
  getProductServiceById,
  updateProductService,
  deleteProductService
} from '../controllers/ProductServiceController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', authMiddleware, createProductService);
router.get('/', authMiddleware, getAllProductServices);
router.get('/:id', authMiddleware, getProductServiceById);
router.put('/:id', authMiddleware, updateProductService);
router.delete('/:id', authMiddleware, deleteProductService);

export default router;
