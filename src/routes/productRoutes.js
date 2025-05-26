import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create a new product
router.post("/create", /* authMiddleware, */ createProduct);

// Get all products
router.get("/", /* authMiddleware, */ getAllProducts);

// Get product by ID
router.get("/:id", /* authMiddleware, */ getProductById);

// Update product by ID
router.put("/:id", /* authMiddleware, */ updateProduct);

// Delete product by ID
router.delete("/:id", /* authMiddleware, */ deleteProduct);

export default router;
