// src/routes/GoodsReturnNoteRoutes.js

import express from "express";
import {
  createGoodsReturnNote,
  getAllGoodsReturnNotes,
  getGoodsReturnNoteById,
  updateGoodsReturnNote,
  deleteGoodsReturnNote
} from "../controllers/GoodsReturnNoteController.js";

const router = express.Router();

// Create GRN
router.post("/create", createGoodsReturnNote);

// Get all GRNs
router.get("/", getAllGoodsReturnNotes);

// Get GRN by ID
router.get("/:id", getGoodsReturnNoteById);

// Update GRN by ID
router.put("/:id", updateGoodsReturnNote);

// Delete GRN by ID
router.delete("/:id", deleteGoodsReturnNote);

export default router;
