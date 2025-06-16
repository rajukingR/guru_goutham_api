// routes/clientDetailsRoutes.js

import express from 'express';
import {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient
} from '../controllers/ClientDetailsController.js';

const router = express.Router();

// POST /clients - Create new client
router.post('/create', createClient);

// GET /clients - Get all clients
router.get('/', getAllClients);

// GET /clients/:id - Get client by ID
router.get('/:id', getClientById);

// PUT /clients/:id - Update client by ID
router.put('/:id', updateClient);

// DELETE /clients/:id - Delete client by ID
router.delete('/:id', deleteClient);

export default router;
