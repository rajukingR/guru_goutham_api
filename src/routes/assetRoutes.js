// routes/assetRoutes.js
import express from 'express';
import {
  createAsset,
  getAllAssets,
  getAssetById,
  updateAsset,
  deleteAsset
} from '../controllers/AssetController.js';

const router = express.Router();

router.post('/create', createAsset);
router.get('/', getAllAssets);
router.get('/:id', getAssetById);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);

export default router;
