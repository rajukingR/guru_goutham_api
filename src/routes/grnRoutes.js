import express from 'express';
import {
  createGRN,
  getAllGRNs,
  getAllApprovedGRNs,
  getGRNById,
  updateGRN,
  deleteGRN
} from '../controllers/grnController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', authMiddleware, createGRN);
router.get('/', authMiddleware, getAllGRNs);
router.get('/approved-grns', authMiddleware, getAllApprovedGRNs);
router.get('/:id', authMiddleware, getGRNById);
router.put('/:id', authMiddleware, updateGRN);
router.delete('/:id', authMiddleware, deleteGRN);

export default router;
