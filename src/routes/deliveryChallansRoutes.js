import express from 'express';
import {
  createDeliveryChallan,
  getAllDeliveryChallans,
  getAllDeliveryChallanDelivered,
  getDeliveryChallansByCustomerCode,
  getDeliveryChallansByCustomerCode1,
  getDeliveryChallansByCustomerCodePeripheralAssets,
  getDeliveryChallanById,
  updateDeliveryChallan,
  deleteDeliveryChallan
} from '../controllers/deliveryChallansController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', authMiddleware, createDeliveryChallan);
router.get('/', authMiddleware, getAllDeliveryChallans);
router.get('/approved-delivery-challan', authMiddleware, getAllDeliveryChallanDelivered);
router.get('/customer/:customer_code', authMiddleware, getDeliveryChallansByCustomerCode);
router.get('/customer-details/:customer_code', authMiddleware, getDeliveryChallansByCustomerCode1);
router.get('/peripheral-assets/:customer_code', authMiddleware, getDeliveryChallansByCustomerCodePeripheralAssets);

router.get('/:id', authMiddleware, getDeliveryChallanById);
router.put('/:id', authMiddleware, updateDeliveryChallan);
router.delete('/:id', authMiddleware, deleteDeliveryChallan);

export default router;
