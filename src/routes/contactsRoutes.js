import express from "express";
import {
  createContact,
  getAllContacts,
  getDeliveryChallansContact,
  getContactById,
  updateContact,
  deleteContact,
  getAllContactsActived
} from "../controllers/contactsController.js";

import authMiddleware from "../middlewares/authMiddleware.js";


const router = express.Router();

router.post("/create", authMiddleware, createContact);
router.get("/", authMiddleware, getAllContacts);
router.get("/delivered-contacts", authMiddleware, getDeliveryChallansContact);
router.get('/active-contacts', authMiddleware, getAllContactsActived);
router.get("/:id", authMiddleware, getContactById);
router.put("/:id", authMiddleware, updateContact);
router.delete("/:id", authMiddleware, deleteContact);

export default router;
