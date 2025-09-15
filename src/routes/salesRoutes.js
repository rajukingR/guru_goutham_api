import express from 'express';
import { getSalesReport ,getSalesAllLeads,getAllSalesOrdersReport } from '../controllers/sales-reports/SalesReportsController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get('/', authMiddleware, getSalesReport);
router.get('/leads-reports', authMiddleware, getSalesAllLeads);
router.get('/orders-reports', authMiddleware, getAllSalesOrdersReport);

export default router;