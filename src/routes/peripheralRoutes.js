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

router.post("/create", createPeripheral);
router.get("/", getAllPeripherals);
router.get("/:id", getPeripheralById);
router.put("/:id", updatePeripheral);
router.delete("/:id", deletePeripheral);

export default router;
