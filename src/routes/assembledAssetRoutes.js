import express from 'express';
import {
  createAssembledAsset,
  getAllAssembledAssets,
  getAssembledAssetById,
  updateAssembledAsset,
  deleteAssembledAsset
} from '../controllers/assembledAssetController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

import upload from "../middlewares/multer.js";

const router = express.Router();

router.post('/create', upload.single("product_image"), authMiddleware, createAssembledAsset);
router.get('/', authMiddleware, getAllAssembledAssets);
router.get('/:id', authMiddleware, getAssembledAssetById);
router.put('/:id',upload.single("product_image"), authMiddleware, updateAssembledAsset);
router.delete('/:id', authMiddleware, deleteAssembledAsset);

export default router;
