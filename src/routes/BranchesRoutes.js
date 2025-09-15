import express from "express";
import {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} from "../controllers/branchController.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create",authMiddleware, createBranch); 
router.get("/", authMiddleware, getAllBranches); 
router.get("/:id", authMiddleware, getBranchById); 
router.put("/:id", authMiddleware, updateBranch); 
router.delete("/:id", authMiddleware, deleteBranch); 

export default router;
