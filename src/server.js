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


dotenv.config();

const app = express();

//**  Middlewares **//
app.use(express.json()); 
app.use(cors()); 
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


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


export default app;
