import express from "express";
import {
  createContact,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  getAllContactsActived
} from "../controllers/contactsController.js";

import authMiddleware from "../middlewares/authMiddleware.js";


const router = express.Router();

router.post("/create", createContact);
router.get("/", getAllContacts);
router.get('/active-contacts', getAllContactsActived);
router.get("/:id", getContactById);
router.put("/:id", updateContact);
router.delete("/:id", deleteContact);

export default router;
