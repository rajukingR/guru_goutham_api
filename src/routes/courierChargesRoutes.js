import express from 'express';
import {
  createCourierCharges,
  getAllCourierCharges,
  getCourierChargesById,
  updateCourierCharges,
  deleteCourierCharges,
} from '../controllers/courierChargesController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', authMiddleware, createCourierCharges);
router.get('/', authMiddleware, getAllCourierCharges);
router.get('/:id', authMiddleware, getCourierChargesById);
router.put('/:id', authMiddleware, updateCourierCharges);
router.delete('/:id', authMiddleware, deleteCourierCharges);

export default router;
