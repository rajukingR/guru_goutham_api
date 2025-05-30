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

router.get("/", /* authMiddleware, */ getAllProducts);
router.get("/:id", /* authMiddleware, */ getProductById);
router.put("/:id", /* authMiddleware, */ updateProduct);
router.delete("/:id", /* authMiddleware, */ deleteProduct);

export default router;
