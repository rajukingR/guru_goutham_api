import express from "express";
import {
  createAssetSwap,
  getAllAssetSwaps,
  getAllAssetSwaps1,
  getAssetSwapById,
  updateAssetSwap,
  deleteAssetSwap
} from "../controllers/AssetSwapController.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, createAssetSwap);
router.get("/", authMiddleware, getAllAssetSwaps);
router.get("/list", authMiddleware, getAllAssetSwaps1);

router.get("/:id", authMiddleware, getAssetSwapById);
router.put("/:id", authMiddleware, updateAssetSwap);
router.delete("/:id", authMiddleware, deleteAssetSwap);

export default router;
