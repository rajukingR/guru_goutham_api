import express from "express";
import {
  createDispatchOrder,
  getAllDispatchOrders,
  getAllApprovedDispatchOrders,
  getAllApprovedDispatchOrdersApprovedDC,
  getDispatchOrderById,
  updateDispatchOrder,
  deleteDispatchOrder
} from "../controllers/dispatchOrderController.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, createDispatchOrder);
router.get("/", authMiddleware, getAllDispatchOrders);
router.get("/approved", authMiddleware, getAllApprovedDispatchOrders);
router.get("/approved-dc", authMiddleware, getAllApprovedDispatchOrdersApprovedDC);

router.get("/:id", authMiddleware, getDispatchOrderById);
router.put("/:id", authMiddleware, updateDispatchOrder);
router.delete("/:id", authMiddleware, deleteDispatchOrder);

export default router;
