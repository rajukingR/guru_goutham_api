import express from 'express';
import { getSalesReport ,getSalesAllLeads,getAllSalesOrdersReport } from '../controllers/sales-reports/SalesReportsController.js';

const router = express.Router();

router.get('/', getSalesReport);
router.get('/leads-reports', getSalesAllLeads);
router.get('/orders-reports', getAllSalesOrdersReport);

export default router;
