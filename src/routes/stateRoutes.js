import express from 'express';
import {
  createState,
  getAllStates,
  getStateById,
  updateState,
  deleteState,
} from '../controllers/stateController.js';

const router = express.Router();

router.post('/create', createState);
router.get('/', getAllStates);
router.get('/:id', getStateById);
router.put('/:id', updateState);
router.delete('/:id', deleteState);

export default router;
