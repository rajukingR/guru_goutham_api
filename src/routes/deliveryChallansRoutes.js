import express from 'express';
import {
  createDeliveryChallan,
  getAllDeliveryChallans,
  getAllDeliveryChallanDelivered,
  getDeliveryChallanById,
  updateDeliveryChallan,
  deleteDeliveryChallan
} from '../controllers/deliveryChallansController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', createDeliveryChallan);
router.get('/', getAllDeliveryChallans);
router.get('/approved-delivery-challan', getAllDeliveryChallanDelivered);
router.get('/:id', getDeliveryChallanById);
router.put('/:id', updateDeliveryChallan);
router.delete('/:id', deleteDeliveryChallan);

export default router;
