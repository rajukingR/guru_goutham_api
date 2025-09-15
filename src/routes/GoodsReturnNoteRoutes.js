// src/routes/GoodsReturnNoteRoutes.js

import express from "express";
import {
  createGoodsReturnNote,
  getAllGoodsReturnNotes,
  getGoodsReturnNoteById,
  updateGoodsReturnNote,
  deleteGoodsReturnNote
} from "../controllers/GoodsReturnNoteController.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, createGoodsReturnNote);
router.get("/", authMiddleware, getAllGoodsReturnNotes);
router.get("/:id", authMiddleware, getGoodsReturnNoteById);
router.put("/:id", authMiddleware, updateGoodsReturnNote);
router.delete("/:id", authMiddleware, deleteGoodsReturnNote);

export default router;
