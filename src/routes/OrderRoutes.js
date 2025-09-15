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

router.post('/create', authMiddleware, createOrder);
router.get('/', authMiddleware, getAllOrders);
router.get('/order-approved', authMiddleware, getAllOrdersApproved);
router.get('/:id', authMiddleware, getOrderById);
router.put('/:id', authMiddleware, updateOrder);
router.delete('/:id', authMiddleware, deleteOrder);

export default router;
