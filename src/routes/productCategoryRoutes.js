import express from 'express';
import {
  createProductCategory,
  getAllProductCategories,
  getProductCategoryById,
  updateProductCategory,
  deleteProductCategory
} from '../controller/productCategoryController.js';

const router = express.Router();

router.post('/create', createProductCategory);
router.get('/', getAllProductCategories);
router.get('/:id', getProductCategoryById);
router.put('/:id', updateProductCategory);
router.delete('/:id', deleteProductCategory);

export default router;
