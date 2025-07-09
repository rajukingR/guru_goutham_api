import express from 'express';
import {getAllAssetModifications,getAllAssetIds,getAssetIdsByProductId} from '../controllers/assetController.js';


const router = express.Router();

router.get('/', getAllAssetModifications);

router.get('/asset-ids', getAllAssetIds);
router.get('/product_id/:id', getAssetIdsByProductId);
export default router;
