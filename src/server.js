import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import db from './config/db.js';
import parentRouter from './routes/parentRouter.js';
import userRoutes from './routes/userDetailsRoutes.js';
import productRoutes from './routes/productRoutes.js';
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
import grnRoutes from './routes/grnRoutes.js';
import rolesRoutes from './routes/rolesRoutes.js';
import clientsRoutes from './routes/clientsRoutes.js';
import contactTypeRoutes from './routes/contactTypeRoutes.js';
import taxTypeRoutes from './routes/taxTypeRoutes.js';
import purchaseRequestsRoutes from './routes/purchaseRequestsRoutes.js';
import productTempleteRoutes from './routes/productTempleteRoutes.js';
import productCategoriesRoutes from './routes/productCategoriesRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import stockLocationRoutes from './routes/stockLocationRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import taxListRoutes from './routes/taxListRoutes.js';
import branchRoutes from "./routes/branchRoutes.js";
import GoodsReturnNoteRoutes from "./routes/GoodsReturnNoteRoutes.js";
import productServiceRoutes from './routes/ProductServiceRoutes.js';
import CreditNoteRoutes from './routes/CreditNoteRoutes.js';
import clientRoutes from './routes/clientDetailsRoutes.js';

import assetRoutesTracker from './routes/AssetRoutes.js';
import assetModificationRoutes from './routes/assetModificationRoutes.js';
import ramSpecRoutes from './routes/ramSpecRoutes.js'; // Adjust path as needed


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


app.use('/api', parentRouter)
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
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
app.use('/api/grns', grnRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/contact-types', contactTypeRoutes);
app.use('/api/tax-types', taxTypeRoutes);
app.use('/api/purchase-requests', purchaseRequestsRoutes);
app.use('/api/product-templete', productTempleteRoutes);
app.use('/api/product-categories', productCategoriesRoutes);
app.use('/api/product-brands', brandRoutes);
app.use('/api/stock-location', stockLocationRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/tax-list', taxListRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/goods-return-notes", grnRoutes);
app.use('/api/product-services', productServiceRoutes);
app.use('/api/credit-notes', CreditNoteRoutes);
app.use('/api/user', clientRoutes);
app.use('/api/asset-modification', assetRoutesTracker);
app.use('/api/asset-modifications', assetModificationRoutes);
app.use('/api/ram-specs', ramSpecRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


export default app;