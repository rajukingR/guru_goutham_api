// routes/ServiceStatusRoutes.js
import express from 'express';
import {
  createServiceStatus,
  getAllServiceStatus,
  getServiceStatusById,
  updateServiceStatus,
  deleteServiceStatus
} from '../controllers/ServiceStatusController.js';

const router = express.Router();

router.post('/create', createServiceStatus);
router.get('/', getAllServiceStatus);
router.get('/:id', getServiceStatusById);
router.put('/:id', updateServiceStatus);
router.delete('/:id', deleteServiceStatus);

export default router;
