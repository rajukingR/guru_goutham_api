import express from "express";
import {
  createBrand,
  getAllBrands,
  getActiveBrands,
  getBrandById,
  updateBrand,
  deleteBrand
} from "../controllers/BrandController.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create",authMiddleware, createBrand);
router.get("/", authMiddleware, getAllBrands);
router.get("/active", authMiddleware, getActiveBrands);
router.get("/:id", authMiddleware, getBrandById);
router.put("/:id", authMiddleware, updateBrand);
router.delete("/:id", authMiddleware, deleteBrand);

export default router;
