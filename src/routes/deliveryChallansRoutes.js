import express from 'express';
import {
  createDeliveryChallan,
  getAllDeliveryChallans,
  getAllDeliveryChallans1,
  getAllDeliveryChallanDelivered,
  getDeliveryChallansByCustomerCode,
  getDeliveryChallansByCustomerCode1,
  getDeliveryChallansByCustomerCodePeripheralAssets,
  getDeliveryChallanById,
  updateDeliveryChallan,
  deleteDeliveryChallan
} from '../controllers/deliveryChallansController.js';

import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.post('/create', authMiddleware, createDeliveryChallan);
router.get('/', authMiddleware, getAllDeliveryChallans);
router.get('/list', authMiddleware, getAllDeliveryChallans1);

router.get('/approved-delivery-challan', authMiddleware, getAllDeliveryChallanDelivered);
router.get('/customer/:customer_code', authMiddleware, getDeliveryChallansByCustomerCode);
router.get('/customer-details/:customer_code', authMiddleware, getDeliveryChallansByCustomerCode1);
router.get('/peripheral-assets/:customer_code', getDeliveryChallansByCustomerCodePeripheralAssets);

router.get('/:id', authMiddleware, getDeliveryChallanById);
router.put('/:id', authMiddleware, upload.single("file"), updateDeliveryChallan);
router.delete('/:id', authMiddleware, deleteDeliveryChallan);

export default router;
