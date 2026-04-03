import express from 'express';
import {
  createProduct,
  getAllProducts,
  getAllProducts1,
  getAllProductsWithoutActive,
  getProductWithAssets,
  getAllAssembledDesktops,
  getProductById,
  getProductByIdWithTransactions,
  updateProduct,
  deleteProduct,
} from '../controllers/ProductTempleteController.js';


import { uploadExcel, bulkUploadProducts, bulkCreateProducts, downloadProductTemplate } from '../controllers/bulkProductController.js';

import authMiddleware from "../middlewares/authMiddleware.js";

import upload from "../middlewares/multer.js";

const router = express.Router();



// Route 1: Upload Excel file (recommended)
router.post('/bulk-upload-excel', 
  authMiddleware, // Ensure authMiddleware doesn't break file upload
  uploadExcel.single('excel_file'), // ← This field name MUST match frontend
  bulkUploadProducts
);
// Route 2: Create multiple products via JSON array
router.post('/bulk-create', 
  authMiddleware, 
  bulkCreateProducts
);

// Route 3: Download template (optional - can be handled by frontend)
router.get('/download-product-template', 
  authMiddleware, 
  (req, res) => {
    // You can send a pre-made Excel template file
    const filePath = 'templates/product_bulk_upload_template.xlsx';
    res.download(filePath);
  }
);




// Add this route to your routes file
router.get('/download-template', 
  authMiddleware, 
  downloadProductTemplate
);

// Fallback function if database query fails
const getDefaultColumns = () => {
  return [
    { field: 'product_category', type: 'varchar(255)', nullable: false },
    { field: 'product_name', type: 'varchar(255)', nullable: false },
    { field: 'product_id', type: 'varchar(255)', nullable: true },
    { field: 'brand', type: 'varchar(255)', nullable: true },
    { field: 'grade', type: 'varchar(255)', nullable: true },
    { field: 'model', type: 'varchar(255)', nullable: true },
    { field: 'pro_model', type: 'varchar(255)', nullable: true },
    { field: 'st_number', type: 'varchar(255)', nullable: true },
    { field: 'stock_location', type: 'varchar(255)', nullable: true },
    { field: 'description', type: 'text', nullable: true },
    { field: 'hsn_code', type: 'varchar(255)', nullable: true },
    { field: 'ram', type: 'varchar(255)', nullable: true },
    { field: 'ram_speed', type: 'varchar(255)', nullable: true },
    { field: 'disk_type', type: 'varchar(255)', nullable: true },
    { field: 'processor', type: 'varchar(255)', nullable: true },
    { field: 'processor_model', type: 'varchar(255)', nullable: true },
    { field: 'processor_speed', type: 'varchar(255)', nullable: true },
    { field: 'generation', type: 'varchar(255)', nullable: true },
    { field: 'storage', type: 'varchar(255)', nullable: true },
    { field: 'graphics', type: 'varchar(255)', nullable: true },
    { field: 'os', type: 'varchar(255)', nullable: true },
    { field: 'display_size', type: 'varchar(255)', nullable: true },
    { field: 'mouse', type: 'tinyint(1)', nullable: true },
    { field: 'keyboard', type: 'tinyint(1)', nullable: true },
    { field: 'dvd', type: 'tinyint(1)', nullable: true },
    { field: 'speaker', type: 'tinyint(1)', nullable: true },
    { field: 'webcam', type: 'tinyint(1)', nullable: true },
    { field: 'motherboard', type: 'varchar(255)', nullable: true },
    { field: 'cabinet', type: 'varchar(255)', nullable: true },
    { field: 'smps', type: 'varchar(255)', nullable: true },
    { field: 'ram_slots', type: 'varchar(255)', nullable: true },
    { field: 'screen_size', type: 'varchar(255)', nullable: true },
    { field: 'capacity', type: 'varchar(255)', nullable: true },
    { field: 'speed', type: 'varchar(255)', nullable: true },
    { field: 'frequency_band', type: 'varchar(255)', nullable: true },
    { field: 'wifi_standard', type: 'varchar(255)', nullable: true },
    { field: 'ssd_type', type: 'varchar(255)', nullable: true },
    { field: 'ramType', type: 'varchar(255)', nullable: true },
    { field: 'sizeGb', type: 'varchar(255)', nullable: true },
    { field: 'frequencyMhz', type: 'varchar(255)', nullable: true },
    { field: 'manufacturer', type: 'varchar(255)', nullable: true },
    { field: 'purchase_price', type: 'decimal(10,2)', nullable: false },
    { field: 'rent_percent_per_day', type: 'decimal(5,2)', nullable: true },
    { field: 'rent_price_per_day', type: 'decimal(10,2)', nullable: true },
    { field: 'rent_percent_per_month', type: 'decimal(5,2)', nullable: false },
    { field: 'rent_price_per_month', type: 'decimal(10,2)', nullable: true },
    { field: 'rent_percent_6_months', type: 'decimal(5,2)', nullable: true },
    { field: 'rent_price_6_months', type: 'decimal(10,2)', nullable: true },
    { field: 'rent_percent_1_year', type: 'decimal(5,2)', nullable: true },
    { field: 'rent_price_1_year', type: 'decimal(10,2)', nullable: true },
    { field: 'offer_purchase_price', type: 'decimal(10,2)', nullable: true },
    { field: 'rent_to_buy_offer_purchase_price', type: 'decimal(10,2)', nullable: true },
    { field: 'offer_rent_price_per_month', type: 'decimal(10,2)', nullable: true },
    { field: 'is_active', type: 'tinyint(1)', nullable: true },
    { field: 'display_device', type: 'varchar(255)', nullable: true },
    { field: 'power_consumption', type: 'varchar(255)', nullable: true },
    { field: 'resolution', type: 'varchar(255)', nullable: true },
    { field: 'brightness', type: 'varchar(255)', nullable: true },
    { field: 'color', type: 'varchar(255)', nullable: true },
    { field: 'audio_output', type: 'varchar(255)', nullable: true },
    { field: 'weight', type: 'varchar(255)', nullable: true },
    { field: 'assembled_id', type: 'varchar(255)', nullable: true }
  ];
};


router.post('/create', upload.single("product_image"), authMiddleware, createProduct);
router.get('/', authMiddleware, getAllProducts);
router.get('/products', authMiddleware, getAllProducts1);

router.get('/without-active', authMiddleware, getAllProductsWithoutActive);
router.get('/products-with-assets', authMiddleware, getProductWithAssets);
router.get('/assembled-desktops', authMiddleware, getAllAssembledDesktops);
router.get('/:id', getProductById);
router.get('/asset-transaction/:id', getProductByIdWithTransactions);

router.put('/:id', upload.single('product_image'), authMiddleware, updateProduct);
router.delete('/:id', authMiddleware, deleteProduct);

export default router;
