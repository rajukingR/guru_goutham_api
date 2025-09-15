import express from "express";
import {
  createServiceCharges,
  getAllServiceCharges,
  getServiceChargesById,
  updateServiceCharges,
  deleteServiceCharges,
} from "../controllers/serviceChargesController.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, createServiceCharges);
router.get("/", authMiddleware, getAllServiceCharges);
router.get("/:id", authMiddleware, getServiceChargesById);
router.put("/:id", authMiddleware, updateServiceCharges);
router.delete("/:id", authMiddleware, deleteServiceCharges);

export default router;
