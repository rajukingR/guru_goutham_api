import express from "express";
import {
  createAssetTransaction,
  getAssetTransactions,
  getAssetTransactionById,
  updateAssetTransaction,
  deleteAssetTransaction
} from "../controllers/assetTransactionController.js";

const router = express.Router();

router.post("/create", createAssetTransaction);
router.get("/", getAssetTransactions);
router.get("/:id", getAssetTransactionById);
router.put("/:id", updateAssetTransaction);
router.delete("/:id", deleteAssetTransaction);

export default router;
