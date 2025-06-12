// src/controllers/GoodsReturnNoteController.js
import db from "../models/index.js";

const GoodsReturnNote = db.GoodsReturnNote;

// Create a new GRN
export const createGoodsReturnNote = async (req, res) => {
  try {
    const data = await GoodsReturnNote.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error creating GRN", error: error.message });
  }
};

// Get all GRNs
export const getAllGoodsReturnNotes = async (req, res) => {
  try {
    const data = await GoodsReturnNote.findAll();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching GRNs", error: error.message });
  }
};

// Get GRN by ID
export const getGoodsReturnNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await GoodsReturnNote.findByPk(id);
    if (!data) return res.status(404).json({ message: "GRN not found" });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching GRN", error: error.message });
  }
};

// Update GRN by ID
export const updateGoodsReturnNote = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await GoodsReturnNote.update(req.body, { where: { id } });
    if (!updated) return res.status(404).json({ message: "GRN not found or no changes" });
    const updatedGRN = await GoodsReturnNote.findByPk(id);
    res.status(200).json(updatedGRN);
  } catch (error) {
    res.status(500).json({ message: "Error updating GRN", error: error.message });
  }
};

// Delete GRN by ID
export const deleteGoodsReturnNote = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await GoodsReturnNote.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: "GRN not found" });
    res.status(200).json({ message: "GRN deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting GRN", error: error.message });
  }
};
