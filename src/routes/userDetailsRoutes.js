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

router.post("/create",upload.single('image'), createUser);
router.get("/" ,getAllUsers);
router.get("/:id", getUserById);
router.put("/:id",upload.single('image'), updateUser);
router.delete("/:id", deleteUser);

export default router;
