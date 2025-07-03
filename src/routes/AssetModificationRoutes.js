import express from 'express';
import {
  createAssetModification,
  getAllAssetModifications,
  getAssetModificationById,
  updateAssetModification,
  deleteAssetModification
} from '../controllers/assetModificationTrackerController.js';

const router = express.Router();

router.post('/create', createAssetModification);
router.get('/', getAllAssetModifications);
router.get('/:id', getAssetModificationById);
router.put('/:id', updateAssetModification);
router.delete('/:id', deleteAssetModification);

export default router;
