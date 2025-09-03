import express from 'express';
import {
  createAssembledAsset,
  getAllAssembledAssets,
  getAssembledAssetById,
  updateAssembledAsset,
  deleteAssembledAsset
} from '../controllers/assembledAssetController.js';

import upload from "../middlewares/multer.js";

const router = express.Router();

router.post('/create', upload.single("product_image"), createAssembledAsset);
router.get('/', getAllAssembledAssets);
router.get('/:id', getAssembledAssetById);
router.put('/:id',upload.single("product_image"), updateAssembledAsset);
router.delete('/:id', deleteAssembledAsset);

export default router;
