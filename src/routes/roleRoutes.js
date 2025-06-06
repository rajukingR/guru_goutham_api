import express from 'express';
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from '../controllers/roleController.js';

const router = express.Router();

// Create a new role
router.post('/create', createRole);

// Get all roles
router.get('/', getAllRoles);

// Get a single role by ID
router.get('/:id', getRoleById);

// Update a role by ID
router.put('/:id', updateRole);

// Delete a role by ID
router.delete('/:id', deleteRole);

export default router;