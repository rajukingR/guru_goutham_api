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
router.post("/create", authMiddleware, createInvoice);
router.get("/",authMiddleware, getAllInvoices);
router.get("/approved-invoices", authMiddleware, getAllApprovedInvoices );
router.get("/:id", authMiddleware, getInvoiceById);
router.get("/invoices/customer/:customer_id", authMiddleware, getInvoicesByCustomerId);
router.get("/get-customer-id/:id", authMiddleware, getInvoicesByInvoiceId);
router.get("/customer/:customer_id", authMiddleware, getCustomerInvoices );
router.get("/customer/:customer_id/:", authMiddleware, getCustomerInvoices );
router.get("/customer/:customer_id/:invoice_date", authMiddleware, getCustomerInvoicesByDate);
router.put("/:id", authMiddleware, updateInvoice);
router.delete("/:id", authMiddleware, deleteInvoice);

export default router;
