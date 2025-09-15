import express from 'express';
import {
  createStockLocation,
  getAllStockLocations,
  getAllActiveStockLocations,
  getStockLocationById,
  updateStockLocation,
  deleteStockLocation,
} from '../controllers/stockLocationController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', authMiddleware, createStockLocation);
router.get('/', authMiddleware, getAllStockLocations);
router.get('/active-stock-location', authMiddleware, getAllActiveStockLocations);

router.get('/:id', authMiddleware, getStockLocationById);
router.put('/:id', authMiddleware, updateStockLocation);
router.delete('/:id', authMiddleware, deleteStockLocation);

export default router;
