// routes/brand.routes.js

import express from 'express';
import BrandController from '../controllers/BrandController.js';

const router = express.Router();

// Create a new brand
router.post('/create', BrandController.create);

// Get all brands
router.get('/', BrandController.findAll);

// Get a brand by ID
router.get('/:id', BrandController.findOne);

// Update a brand by ID
router.put('/:id', BrandController.update);

// Delete a brand by ID
router.delete('/:id', BrandController.delete);

export default router;
