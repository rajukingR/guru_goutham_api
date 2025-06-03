import express from "express";
import {
  createBrand,
  getAllBrands,
  getActiveBrands,
  getBrandById,
  updateBrand,
  deleteBrand
} from "../controllers/BrandController.js";

const router = express.Router();

router.post("/create", createBrand);
router.get("/", getAllBrands);
router.get("/active", getActiveBrands);
router.get("/:id", getBrandById);
router.put("/:id", updateBrand);
router.delete("/:id", deleteBrand);

export default router;
