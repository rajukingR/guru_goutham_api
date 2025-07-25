import express from "express";
import {
  createInvoice,
  getAllInvoices,
  getAllApprovedInvoices ,
  getInvoiceById,
  getCustomerInvoices,
  getCustomerInvoicesByDate,
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
router.get("/invoices/customer/:customer_id", getInvoicesByCustomerId);
router.get("/get-customer-id/:id", getInvoicesByInvoiceId);
router.get("/customer/:customer_id", getCustomerInvoices );
router.get("/customer/:customer_id/:", getCustomerInvoices );
router.get("/customer/:customer_id/:invoice_date", getCustomerInvoicesByDate);
router.put("/:id", updateInvoice);
router.delete("/:id", deleteInvoice);

export default router;
