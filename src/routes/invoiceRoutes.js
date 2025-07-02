import express from "express";
import {
  createInvoice,
  getAllInvoices,
  getAllApprovedInvoices ,
  getInvoiceById,
  getInvoicesByCustomerId,
  getInvoicesByInvoiceId,
  updateInvoice,
  deleteInvoice,
  
} from "../controllers/invoiceController.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Invoice Routes
router.post("/create", createInvoice);
router.get("/", getAllInvoices);
router.get("/approved-invoices", getAllApprovedInvoices );
router.get("/:id", getInvoiceById);
router.get("/get-customer-id/:id", getInvoicesByInvoiceId);

router.put("/:id", updateInvoice);
router.delete("/:id", deleteInvoice);

export default router;
