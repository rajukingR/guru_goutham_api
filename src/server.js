import express from 'express';
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
import branchesRoutes from './routes/branchesRoutes.js';
import clientsRoutes from './routes/clientsRoutes.js';
import contactTypeRoutes from './routes/contactTypeRoutes.js';
import taxTypeRoutes from './routes/taxTypeRoutes.js';
import purchaseRequestsRoutes from './routes/purchaseRequestsRoutes.js';


dotenv.config();

const app = express();

//**  Middlewares **//
app.use(express.json()); 

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true, // if you are using cookies or auth headers
}));

app.use(morgan('dev'));
app.use(helmet());


db.authenticate()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.log('Database connection failed:', err));

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
app.use('/api/branches', branchesRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/contact-types', contactTypeRoutes);
app.use('/api/tax-types', taxTypeRoutes);
app.use('/api/purchase-requests', purchaseRequestsRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


export default app;
