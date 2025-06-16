import express from 'express';
import {
  createProductService,
  getAllProductServices,
  getProductServiceById,
  updateProductService,
  deleteProductService
} from '../controllers/ProductServiceController.js';

const router = express.Router();

// Create a new product/service
router.post('/create', createProductService);

// Get all products/services
router.get('/', getAllProductServices);

// Get a single product/service by ID
router.get('/:id', getProductServiceById);

// Update a product/service by ID
router.put('/:id', updateProductService);

// Delete a product/service by ID
router.delete('/:id', deleteProductService);

export default router;
