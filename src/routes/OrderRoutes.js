import express from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getAllOrdersApproved
} from '../controllers/OrderControllerCrm.js';

import authMiddleware from "../middlewares/authMiddleware.js";


const router = express.Router();

router.post('/create', createOrder);
router.get('/', getAllOrders);
router.get('/order-approved', getAllOrdersApproved);
router.get('/:id', getOrderById);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

export default router;
