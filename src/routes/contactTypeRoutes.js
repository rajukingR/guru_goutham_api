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

router.post('/create', authMiddleware, createContactType);
router.get('/', authMiddleware, getAllContactTypes);
router.get('/:id', authMiddleware, getContactTypeById);
router.put('/:id', authMiddleware, updateContactType);
router.delete('/:id', authMiddleware, deleteContactType);

export default router;
