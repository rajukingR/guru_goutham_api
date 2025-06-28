import express from 'express';
import { getSalesReport } from '../controllers/sales-reports/SalesReportsController.js';

const router = express.Router();

router.get('/', getSalesReport);

export default router;
