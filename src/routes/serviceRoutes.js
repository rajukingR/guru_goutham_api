import express from 'express';
import {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
} from '../controllers/serviceController.js';

const router = express.Router();

// Service routes
router.post('/create', createService);
router.get('/', getAllServices);
router.get('/:id', getServiceById);                                         
router.put('/:id', updateService);
router.delete('/:id', deleteService);

export default router;