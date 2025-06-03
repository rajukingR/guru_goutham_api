import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/ProductTempleteController.js';


import upload from "../middlewares/multer.js";

const router = express.Router();

router.post('/create', upload.single("product_image"), createProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', upload.single('product_image'), updateProduct);
router.delete('/:id', deleteProduct);

export default router;
