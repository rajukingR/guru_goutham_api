import express from 'express';
import {getAllAssetModifications,getAllAssetIds,getAssetIdsByProductId,updateAssetComponents} from '../controllers/assetController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get('/', authMiddleware, getAllAssetModifications);

router.get('/asset-ids', authMiddleware, getAllAssetIds);
router.get('/product-id/:id', authMiddleware, getAssetIdsByProductId);
router.put('/:id', authMiddleware, updateAssetComponents);

export default router;
