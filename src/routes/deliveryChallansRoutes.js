import express from 'express';
import {
  createDeliveryChallan,
  getAllDeliveryChallans,
  getDeliveryChallanById,
  updateDeliveryChallan,
  deleteDeliveryChallan
} from '../controllers/deliveryChallansController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', createDeliveryChallan);
router.get('/', getAllDeliveryChallans);
router.get('/:id', getDeliveryChallanById);
router.put('/:id', updateDeliveryChallan);
router.delete('/:id', deleteDeliveryChallan);

export default router;
