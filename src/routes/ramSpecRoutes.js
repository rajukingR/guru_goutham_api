import express from 'express';
import {
  createRamSpec,
  getAllRamSpecs,
  getRamSpecById,
  updateRamSpec,
  deleteRamSpec,
} from '../controllers/ramSpecController.js';

const router = express.Router();
router.post('/create', createRamSpec);
router.get('/', getAllRamSpecs);
router.get('/:id', getRamSpecById);
router.put('/:id', updateRamSpec);
router.delete('/:id', deleteRamSpec);

export default router;
