// src/controllers/gradeController.js

import db from '../models/index.js';

const Grade = db.Grade;

// Create a new Grade
export const createGrade = async (req, res) => {
  try {
    const { grade_id, grade_name, description, is_active } = req.body;

    const existing = await Grade.findOne({ where: { grade_id } });
    if (existing) {
      return res.status(400).json({ message: 'Grade ID already exists' });
    }

    const newGrade = await Grade.create({
      grade_id,
      grade_name,
      description,
      is_active,
    });

    return res.status(201).json({ message: 'Grade created successfully', data: newGrade });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating grade', error: error.message });
  }
};

// Get all Grades
export const getAllGrades = async (req, res) => {
  try {
    const grades = await Grade.findAll();
    return res.status(200).json(grades);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching grades', error: error.message });
  }
};

// Get single Grade by ID
export const getGradeById = async (req, res) => {
  try {
    const id = req.params.id;
    const grade = await Grade.findByPk(id);

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    return res.status(200).json(grade);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching grade', error: error.message });
  }
};

// Update Grade
export const updateGrade = async (req, res) => {
  try {
    const id = req.params.id;
    const { grade_id, grade_name, description, is_active } = req.body;

    const grade = await Grade.findByPk(id);

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    await grade.update({
      grade_id,
      grade_name,
      description,
      is_active,
      updated_at: new Date(),
    });

    return res.status(200).json({ message: 'Grade updated successfully', data: grade });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating grade', error: error.message });
  }
};

// Delete Grade
export const deleteGrade = async (req, res) => {
  try {
    const id = req.params.id;
    const grade = await Grade.findByPk(id);

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    await grade.destroy();

    return res.status(200).json({ message: 'Grade deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting grade', error: error.message });
  }
};
