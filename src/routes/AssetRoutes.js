import express from 'express';
import {getAllAssetModifications} from '../controllers/assetController.js';


const router = express.Router();

router.get('/', getAllAssetModifications);


export default router;
