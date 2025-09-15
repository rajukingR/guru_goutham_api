import express from 'express';
import {
  createRamSpec,
  getAllRamSpecs,
  getRamSpecById,
  updateRamSpec,
  deleteRamSpec,
} from '../controllers/ramSpecController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
router.post('/create', authMiddleware, createRamSpec);
router.get('/', authMiddleware, getAllRamSpecs);
router.get('/:id', authMiddleware, getRamSpecById);
router.put('/:id', authMiddleware, updateRamSpec);
router.delete('/:id', authMiddleware, deleteRamSpec);

export default router;
