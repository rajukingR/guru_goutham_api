import express from "express";
import {
  createPeripheral,
  getAllPeripherals,
  getPeripheralById,
  updatePeripheral,
  deletePeripheral,
} from "../controllers/PeripheralController.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, createPeripheral);
router.get("/", authMiddleware, getAllPeripherals);
router.get("/:id", authMiddleware, getPeripheralById);
router.put("/:id", authMiddleware, updatePeripheral);
router.delete("/:id", authMiddleware, deletePeripheral);

export default router;
