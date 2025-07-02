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

router.post('/create', createGRN);
router.get('/', getAllGRNs);
router.get('/approved-grns', getAllApprovedGRNs);
router.get('/:id', getGRNById);
router.put('/:id', updateGRN);
router.delete('/:id', deleteGRN);

export default router;
