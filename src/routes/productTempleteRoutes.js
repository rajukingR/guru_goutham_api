import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductWithAssets,
  getAllAssembledDesktops,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/ProductTempleteController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

import upload from "../middlewares/multer.js";

const router = express.Router();

router.post('/create', upload.single("product_image"), authMiddleware, createProduct);
router.get('/', authMiddleware, getAllProducts);
router.get('/products-with-assets', authMiddleware, getProductWithAssets);
router.get('/assembled-desktops', authMiddleware, getAllAssembledDesktops);
router.get('/:id', authMiddleware, getProductById);
router.put('/:id', upload.single('product_image'), authMiddleware, updateProduct);
router.delete('/:id', authMiddleware, deleteProduct);

export default router;
