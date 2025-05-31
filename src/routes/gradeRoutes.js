// src/routes/gradeRoutes.js

import express from 'express';
import {
  createGrade,
  getAllGrades,
  getGradeById,
  updateGrade,
  deleteGrade,
} from '../controllers/gradeController.js';

const router = express.Router();

// Routes
router.post('/create', createGrade);           // Create new grade
router.get('/', getAllGrades);           // Get all grades
router.get('/:id', getGradeById);        // Get grade by ID
router.put('/:id', updateGrade);         // Update grade by ID
router.delete('/:id', deleteGrade);      // Delete grade by ID

export default router;
