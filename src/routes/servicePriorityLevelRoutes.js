import express from 'express';
import {
  createServicePriorityLevel,
  getAllServicePriorityLevels,
  getServicePriorityLevelById,
  updateServicePriorityLevel,
  deleteServicePriorityLevel,
} from '../controllers/servicePriorityLevelController.js';

const router = express.Router();

router.post('/create', createServicePriorityLevel);
router.get('/', getAllServicePriorityLevels);
router.get('/:id', getServicePriorityLevelById);
router.put('/:id', updateServicePriorityLevel);
router.delete('/:id', deleteServicePriorityLevel);

export default router;
