import express from 'express';
import {
  createCity,
  getAllCities,
  getCityById,
  updateCity,
  deleteCity,
  getActiveCities
} from '../controllers/cityController.js';

const router = express.Router();

router.post('/create', createCity);
router.get('/', getAllCities);
router.get('/:id', getActiveCities);
router.get('/:id', getCityById);
router.put('/:id', updateCity);
router.delete('/:id', deleteCity);

export default router;