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

router.post('/create', createDeliveryChallan);
router.get('/', getAllDeliveryChallans);
router.get('/approved-delivery-challan', getAllDeliveryChallanDelivered);
router.get('/customer/:customer_code', getDeliveryChallansByCustomerCode);
router.get('/customer-details/:customer_code', getDeliveryChallansByCustomerCode1);
router.get('/peripheral-assets/:customer_code', getDeliveryChallansByCustomerCodePeripheralAssets);

router.get('/:id', getDeliveryChallanById);
router.put('/:id', updateDeliveryChallan);
router.delete('/:id', deleteDeliveryChallan);

export default router;
