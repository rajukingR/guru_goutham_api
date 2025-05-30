import express from 'express';
import {
  createContactType,
  getAllContactTypes,
  getContactTypeById,
  updateContactType,
  deleteContactType,
} from '../controllers/contactTypeController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', createContactType);
router.get('/', getAllContactTypes);
router.get('/:id', getContactTypeById);
router.put('/:id', updateContactType);
router.delete('/:id', deleteContactType);

export default router;
