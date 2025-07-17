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

const router = express.Router();

router.post("/create", createDispatchOrder);
router.get("/", getAllDispatchOrders);
router.get("/approved", getAllApprovedDispatchOrders);
router.get("/approved-dc", getAllApprovedDispatchOrdersApprovedDC);

router.get("/:id", getDispatchOrderById);
router.put("/:id", updateDispatchOrder);
router.delete("/:id", deleteDispatchOrder);

export default router;
