import express from "express";
import {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
  } from "../controllers/userDetailsController.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", createUser);
router.get("/" ,getAllUsers);
router.get("/:id",authMiddleware, getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
