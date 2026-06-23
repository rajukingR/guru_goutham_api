import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import db from './config/db.js';
import cron from 'node-cron';
import axios from 'axios';
import https from 'https';
import parentRouter from './routes/parentRouter.js';
import userRoutes from './routes/userDetailsRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import PurchaseQuotationRoutes from './routes/PurchaseQuotationRoutes.js';
import purchaseOrdersRoutes from './routes/purchaseOrdersRoutes.js';
import goodsReceiptRoutes from './routes/goodsReceiptRoutes.js';
import contactsRoutes from './routes/contactsRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import QuotationRoutes from './routes/QuotationRoutes.js';
import OrderRoutes from './routes/OrderRoutes.js';
import deliveryChallansRoutes from './routes/deliveryChallansRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import rolesRoutes from './routes/rolesRoutes.js';
import taxTypeRoutes from './routes/taxTypeRoutes.js';
import purchaseRequestsRoutes from './routes/purchaseRequestsRoutes.js';
import productTempleteRoutes from './routes/productTempleteRoutes.js';
import productCategoriesRoutes from './routes/productCategoriesRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import CreditNoteRoutes from './routes/CreditNoteRoutes.js';

import stateRoutes from './routes/salesRoutes.js';
import dispatchOrderRoutes from "./routes/dispatchOrderRoutes.js";
import assembledAssetRoutes from "./routes/assembledAssetRoutes.js";
import peripheralRoutes from "./routes/peripheralRoutes.js";
import courierChargesRoutes from './routes/courierChargesRoutes.js';
import serviceChargesRoutes from "./routes/serviceChargesRoutes.js";
import assetSwapRoutes from "./routes/assetSwapRoutes.js";
import branchesRoutes from "./routes/BranchesRoutes.js";
import createBackup from "../src/utils/dbBackups.js";
import assetTransactionRoutes from "./routes/assetTransactionRoutes.js";

import {
  fileURLToPath
} from 'url';
const __filename = fileURLToPath(
  import.meta.url);
const __dirname = path.dirname(__filename);



// Load environment variables from appropriate file
dotenv.config({
  path: process.env.NODE_ENV === 'production' ?
    '.env.production' :
    process.env.NODE_ENV === 'development' ?
    '.env.development' :
    '.env',
});

const app = express();

//**  Middlewares **//
app.use(express.json());

app.use(
  helmet({
    crossOriginResourcePolicy: false, // ← ALLOWS cross-origin <img src="">
  })
);

// CORS setup
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'https://gurugoutham.innogenxsolutions.com',
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Logging (only in dev)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}



db.authenticate()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.log('Database connection failed:', err));

app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));


app.get('/api/pincode/:pincode', async (req, res) => {
  const { pincode } = req.params;

  if (!/^[1-9][0-9]{5}$/.test(pincode)) {
    return res.status(400).json([{
      Status: "Error",
      Message: "Invalid pincode format",
      PostOffice: []
    }]);
  }

  try {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });

    const response = await axios.get(
      `https://api.postalpincode.in/pincode/${pincode}`,
      {
        httpsAgent,
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json'
        }
      }
    );

    return res.json(response.data);

  } catch (error) {
    console.error('Pincode API Error:', error.message);

    return res.status(500).json([{
      Status: "Error",
      Message: error.message,
      PostOffice: []
    }]);
  }
});

app.use('/api', parentRouter)
app.use('/api/users', userRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/purchase-quotation', PurchaseQuotationRoutes);
app.use('/api/purchase-orders', purchaseOrdersRoutes);
app.use('/api/goods-receipts', goodsReceiptRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/quotations', QuotationRoutes);
app.use('/api/orders', OrderRoutes);
app.use('/api/delivery-challans', deliveryChallansRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/tax-types', taxTypeRoutes);
app.use('/api/purchase-requests', purchaseRequestsRoutes);
app.use('/api/product-templete', productTempleteRoutes);
app.use('/api/product-categories', productCategoriesRoutes);
app.use('/api/product-brands', brandRoutes);
app.use('/api/roles', roleRoutes);
app.use("/api/branches", branchesRoutes);
app.use('/api/credit-notes', CreditNoteRoutes);
app.use('/api/sales-report', stateRoutes);
app.use("/api/dispatch-orders", dispatchOrderRoutes);
app.use("/api/assembled-assets", assembledAssetRoutes);
app.use("/api/peripheral-assets", peripheralRoutes);
app.use('/api/courier-charges', courierChargesRoutes);
app.use("/api/service-charges", serviceChargesRoutes);
app.use("/api/asset-swaps", assetSwapRoutes);
app.use("/api/asset-transactions", assetTransactionRoutes);


// EVEVRYDAY BACKUP CODE 
// cron.schedule('0 0 * * *', () => {
//   console.log('⏰ Running daily midnight DB backup...');
//   createBackup();
// });


// EVERY MINUTE BACKUP CODE
// cron.schedule('* * * * *', () => {
//   console.log('⏰ Running DB backup every minute...');
//   createBackup();
// });


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


export default app;