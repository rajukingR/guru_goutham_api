import express from 'express';
import {
  createProductCategory,
  getAllProductCategories,
  getActiveProductCategories,
  getProductCategoryById,
  updateProductCategory,
  deleteProductCategory
} from '../controllers/ProductCategoriesController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', authMiddleware, createProductCategory);
router.get('/', authMiddleware, getAllProductCategories);
router.get('/active', authMiddleware, getActiveProductCategories);
router.get('/:id', authMiddleware, getProductCategoryById);
router.put('/:id', authMiddleware, updateProductCategory);
router.delete('/:id', authMiddleware, deleteProductCategory);

export default router;
