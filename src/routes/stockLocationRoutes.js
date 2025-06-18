import express from 'express';
import {
  createStockLocation,
  getAllStockLocations,
  getAllActiveStockLocations,
  getStockLocationById,
  updateStockLocation,
  deleteStockLocation,
} from '../controllers/stockLocationController.js';

const router = express.Router();

router.post('/create', createStockLocation);
router.get('/', getAllStockLocations);
router.get('/active-stock-location', getAllActiveStockLocations);

router.get('/:id', getStockLocationById);
router.put('/:id', updateStockLocation);
router.delete('/:id', deleteStockLocation);

export default router;
