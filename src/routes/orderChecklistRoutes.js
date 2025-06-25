import express from 'express';
import {
  createOrderChecklist,
  getAllOrderChecklists,
  getOrderChecklistById,
  updateOrderChecklist,
  deleteOrderChecklist
} from '../controllers/orderChecklistController.js';

const router = express.Router();

router.post('/create', createOrderChecklist);
router.get('/', getAllOrderChecklists);
router.get('/:id', getOrderChecklistById);
router.put('/:id', updateOrderChecklist);
router.delete('/:id', deleteOrderChecklist);

export default router;
