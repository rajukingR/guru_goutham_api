import express from 'express';
import {
  createAssetModification,
  getAllAssetModifications,
  getAssetModificationById,
  updateAssetModification,
  deleteAssetModification
} from '../controllers/assetModificationTrackerController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', authMiddleware, createAssetModification);
router.get('/', authMiddleware, getAllAssetModifications);
router.get('/:id', authMiddleware, getAssetModificationById);
router.put('/:id', authMiddleware, updateAssetModification);
router.delete('/:id', authMiddleware, deleteAssetModification);

export default router;
