import express from "express";
import {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
  } from "../controllers/userDetailsController.js";

import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.post("/create",upload.single('image'),authMiddleware, createUser);
router.get("/" , authMiddleware, getAllUsers);
router.get("/:id", authMiddleware, getUserById);
router.put("/:id",upload.single('image'), authMiddleware, updateUser);
router.delete("/:id", deleteUser);

export default router;
