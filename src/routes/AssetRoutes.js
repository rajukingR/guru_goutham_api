import express from 'express';
import {getAllAssetModifications,getAllAssetIds,getAssetIdsByProductId,updateAssetComponents} from '../controllers/assetController.js';


const router = express.Router();

router.get('/', getAllAssetModifications);

router.get('/asset-ids', getAllAssetIds);
router.get('/product-id/:id', getAssetIdsByProductId);
router.put('/:id', updateAssetComponents);

export default router;
