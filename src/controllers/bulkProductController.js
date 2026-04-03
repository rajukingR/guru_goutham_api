import multer from 'multer';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import {
    fileURLToPath
} from 'url';
import db from '../models/index.js';
import xlsx from "xlsx";
import dotenv from "dotenv";

dotenv.config();

// Get current directory (ES module fix)
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const ProductTemplete = db.ProductTemplete;

// Ensure uploads directory exists - FIXED PATH
const ensureUploadsDirectory = () => {
    // Your file is in src/controllers, so we need to go up one level
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'excel');

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, {
            recursive: true
        });
    } else {
        console.log('Upload directory already exists');
    }

    return uploadDir;
};

// Call this once when module loads
const UPLOAD_DIR = ensureUploadsDirectory();

// Multer configuration for Excel files
const excelStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        try {
            cb(null, UPLOAD_DIR);
        } catch (error) {
            console.error('Error setting upload directory:', error);
            cb(error, null);
        }
    },
    filename: function (req, file, cb) {
        // Clean filename: remove special characters but keep extension
        const fileExt = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, fileExt)
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/_+/g, '_');

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const finalName = 'bulk-' + uniqueSuffix + '-' + baseName + fileExt;

        cb(null, finalName);
    }
});

const excelFilter = (req, file, cb) => {

    const fileExt = file.originalname.split('.').pop().toLowerCase();
    const allowedExtensions = ['xlsx', 'xls', 'csv'];

    if (allowedExtensions.includes(fileExt)) {
        cb(null, true);
    } else {
        cb(new Error('Please upload only Excel (.xlsx, .xls) or CSV files.'), false);
    }
};

export const uploadExcel = multer({
    storage: excelStorage,
    fileFilter: excelFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Main bulk upload controller
export const bulkUploadProducts = async (req, res) => {
    let workbook;
    let jsonData;

    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an Excel file',
                debug: {
                    hasFile: false,
                    contentType: req.headers['content-type'],
                    fileFieldExpected: 'excel_file'
                }
            });
        }

        // Validate file exists on disk
        if (!fs.existsSync(req.file.path)) {
            console.error('✗ ERROR: File does not exist at path:', req.file.path);
            const dir = path.dirname(req.file.path);
            
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
            } else {
                fs.mkdirSync(dir, { recursive: true });
                return res.status(400).json({
                    success: false,
                    message: 'Upload directory was missing. Please try uploading again.',
                    directoryCreated: true,
                    uploadPath: dir
                });
            }

            return res.status(400).json({
                success: false,
                message: 'Uploaded file not found on server. Please try again.',
                filePath: req.file.path,
                currentDirectory: process.cwd()
            });
        }

        // Check file size
        const stats = fs.statSync(req.file.path);

        if (stats.size === 0) {
            cleanupUploadedFile(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Uploaded file is empty',
                fileInfo: {
                    name: req.file.originalname,
                    size: stats.size
                }
            });
        }

        // Read Excel file
        try {
            // Try reading file buffer directly
            const fileBuffer = fs.readFileSync(req.file.path);
            workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        } catch (readError) {
            console.error('✗ Error reading Excel file:', readError.message);
            cleanupUploadedFile(req.file.path);
            
            return res.status(400).json({
                success: false,
                message: 'Cannot read Excel file. Please make sure it is a valid Excel file.',
                error: readError.message
            });
        }

        // Check if workbook has sheets
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            cleanupUploadedFile(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Excel file has no sheets',
                fileInfo: {
                    name: req.file.originalname,
                    size: stats.size
                }
            });
        }

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        if (!worksheet) {
            cleanupUploadedFile(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Could not read the worksheet from Excel file',
                sheetName: firstSheetName
            });
        }

        // Convert worksheet to JSON
        try {
            jsonData = XLSX.utils.sheet_to_json(worksheet);
        } catch (jsonError) {
            console.error('✗ Error converting worksheet to JSON:', jsonError.message);
            cleanupUploadedFile(req.file.path);
            
            return res.status(400).json({
                success: false,
                message: 'Cannot convert Excel data to readable format',
                error: jsonError.message
            });
        }

        if (!jsonData || jsonData.length === 0) {
            cleanupUploadedFile(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Excel file has no data. Please add products to the file.',
                fileInfo: {
                    name: req.file.originalname,
                    size: stats.size,
                    sheets: workbook.SheetNames
                }
            });
        }

        // Display first few rows for debugging
        for (let i = 0; i < Math.min(3, jsonData.length); i++) {
            const row = jsonData[i];
            Object.keys(row).forEach(key => {
            });
        }

        const results = {
            total: jsonData.length,
            success: 0,
            failed: 0,
            skipped: 0,
            errors: [],
            products: []
        };

        // Helper function to check if all values match existing product
        const isExactDuplicate = (productData, existingProduct) => {
            // List of fields to compare
            const fieldsToCompare = [
                'product_category', 'product_name', 'brand', 'grade', 'model', 'stock_location',
                'description', 'ram', 'disk_type', 'ssd_type', 'processor', 'storage',
                'graphics', 'os', 'mouse', 'keyboard', 'dvd', 'speaker', 'webcam',
                'purchase_price', 'offer_purchase_price', 'rent_to_buy_offer_purchase_price',
                'rent_percent_per_day', 'rent_price_per_day', 'rent_percent_per_month',
                'rent_price_per_month', 'offer_rent_price_per_month',
                'rent_percent_6_months', 'rent_price_6_months',
                'rent_percent_1_year', 'rent_price_1_year', 'pro_model',
                'st_number', 'display_device', 'power_consumption', 'resolution',
                'brightness', 'screen_size', 'color', 'audio_output', 'weight',
                'processor_model', 'processor_speed', 'generation', 'ram_speed',
                'ram_slots', 'cabinet', 'motherboard', 'smps', 'capacity',
                'speed', 'ramType', 'sizeGb', 'frequency_band', 'wifi_standard',
                'frequencyMhz', 'manufacturer', 'hsn_code', 'display_size'
            ];

            for (const field of fieldsToCompare) {
                // Skip if field doesn't exist in productData
                if (!(field in productData) && !(field in existingProduct)) {
                    continue;
                }
                
                const dataValue = productData[field];
                const existingValue = existingProduct[field];

                // Handle undefined/null values
                if (dataValue === undefined || dataValue === null) {
                    if (existingValue !== undefined && existingValue !== null) {
                        return false;
                    }
                    continue;
                }
                
                if (existingValue === undefined || existingValue === null) {
                    return false;
                }

                // Handle boolean/tinyint fields
                if (field === 'mouse' || field === 'keyboard' || field === 'dvd' || 
                    field === 'speaker' || field === 'webcam' || field === 'is_active') {
                    const dataBool = Boolean(dataValue);
                    const existingBool = Boolean(existingValue);
                    
                    if (dataBool !== existingBool) {
                        return false;
                    }
                }
                // Handle decimal fields
                else if (field.includes('price') || field.includes('percent') || 
                         field.includes('purchase_price') || field.includes('rent_')) {
                    const dataNum = parseFloat(dataValue) || 0;
                    const existingNum = parseFloat(existingValue) || 0;
                    
                    if (Math.abs(dataNum - existingNum) > 0.01) {
                        return false;
                    }
                }
                // Handle string fields (case insensitive)
                else {
                    const dataStr = String(dataValue).trim().toLowerCase();
                    const existingStr = String(existingValue).trim().toLowerCase();
                    
                    if (dataStr !== existingStr) {
                        return false;
                    }
                }
            }
            
            return true;
        };

        // Process each row
        for (let i = 0; i < jsonData.length; i++) {
            try {
                const excelRow = jsonData[i];

                // Clean and validate data
                const productData = cleanProductData(excelRow);
                const validationErrors = validateProduct(productData);

                if (validationErrors.length > 0) {
                    results.failed++;
                    results.errors.push({
                        row: i + 2,
                        productName: productData.product_name || 'Unknown',
                        errors: validationErrors
                    });
                    continue;
                }

                // Check if product exists with same product_id
                if (productData.product_id) {
                    const existingProduct = await ProductTemplete.findOne({
                        where: {
                            product_id: productData.product_id
                        }
                    });

                    if (existingProduct) {
                        // Check if it's an exact duplicate (all values same)
                        if (isExactDuplicate(productData, existingProduct)) {
                            results.skipped++;
                            continue; // Skip this row - it's an exact duplicate
                        }
                        // If not exact duplicate, update with new data
                        else {
                            
                            // Update the existing product
                            await ProductTemplete.update(productData, {
                                where: {
                                    id: existingProduct.id
                                }
                            });
                            
                            results.success++;
                            results.products.push({
                                id: existingProduct.id,
                                product_id: existingProduct.product_id,
                                product_name: existingProduct.product_name,
                                action: 'updated'
                            });
                            continue;
                        }
                    }
                }

                // If no product_id provided or product_id doesn't exist, create new
                // Generate product_id if not provided
                if (!productData.product_id) {
                    productData.product_id = generateProductId(productData.product_category);
                }

                // Check if generated product_id already exists
                const existingWithGeneratedId = await ProductTemplete.findOne({
                    where: {
                        product_id: productData.product_id
                    }
                });

                if (existingWithGeneratedId) {
                    // Check if all fields match
                    if (isExactDuplicate(productData, existingWithGeneratedId)) {
                        results.skipped++;
                        continue;
                    } else {
                        // Generate a new unique product_id
                        let newProductId = productData.product_id;
                        let counter = 1;
                        while (true) {
                            newProductId = `${productData.product_id}-${counter}`;
                            const exists = await ProductTemplete.findOne({
                                where: { product_id: newProductId }
                            });
                            if (!exists) break;
                            counter++;
                            if (counter > 100) {
                                throw new Error('Cannot generate unique product ID');
                            }
                        }
                        productData.product_id = newProductId;
                    }
                }

                // Create new product
                const product = await ProductTemplete.create(productData);
                results.success++;
                results.products.push({
                    id: product.id,
                    product_id: product.product_id,
                    product_name: product.product_name,
                    action: 'created'
                });

                if (i % 10 === 0 || i === jsonData.length - 1) {
                }

            } catch (rowError) {
                console.error(`❌ Error in row ${i + 1}:`, rowError.message);
                results.failed++;
                results.errors.push({
                    row: i + 2,
                    productName: jsonData[i]?.product_name || 'Unknown',
                    errors: [rowError.message || 'Unknown error occurred']
                });
            }
        }

        // Clean up uploaded file
        cleanupUploadedFile(req.file.path);

        // Send success response
        const response = {
            success: true,
            message: `Bulk upload completed: ${results.success} created, ${results.skipped} skipped (exact duplicates), ${results.failed} failed`,
            summary: {
                total: results.total,
                success: results.success,
                failed: results.failed,
                skipped: results.skipped,
                successRate: results.total > 0 ? `${Math.round((results.success / results.total) * 100)}%` : '0%'
            },
            errors: results.errors.length > 0 ? results.errors : undefined,
            createdProducts: results.products.length > 0 ? results.products.slice(0, 10) : undefined,
            fileInfo: {
                name: req.file.originalname,
                size: req.file.size,
                processedAt: new Date().toISOString()
            }
        };

        if (results.errors.length > 0) {
        }
        if (results.skipped > 0) {
        }

        res.status(200).json(response);

    } catch (error) {
        console.error('💥 UNEXPECTED ERROR in bulk upload:', error);
        console.error('Error stack:', error.stack);

        // Clean up file on error too
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            cleanupUploadedFile(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Server error processing bulk upload',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
};

// Helper function to generate product ID
function generateProductId(category) {
    const prefix = category ? category.substring(0, 3).toUpperCase() : 'PRD';
    const timestamp = Date.now().toString().substr(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `${prefix}-${timestamp}${random}`;
}

// Clean product data function (update according to your table structure)
function cleanProductData(row) {
    const cleaned = {};
    
    // Copy all properties from row
    Object.keys(row).forEach(key => {
        const value = row[key];
        
        // Handle undefined/null
        if (value === undefined || value === null) {
            cleaned[key] = null;
            return;
        }
        
        // Convert string values
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === '') {
                cleaned[key] = null;
            } else {
                cleaned[key] = trimmed;
            }
        } else {
            cleaned[key] = value;
        }
    });
    
    // Convert boolean fields to 1/0
    const booleanFields = ['mouse', 'keyboard', 'dvd', 'speaker', 'webcam', 'is_active'];
    booleanFields.forEach(field => {
        if (cleaned[field] !== undefined && cleaned[field] !== null) {
            if (typeof cleaned[field] === 'string') {
                const val = cleaned[field].toString().toLowerCase().trim();
                cleaned[field] = ['true', '1', 'yes', 'on', 'y'].includes(val) ? 1 : 0;
            } else {
                cleaned[field] = cleaned[field] ? 1 : 0;
            }
        } else {
            // Set default for is_active
            if (field === 'is_active') {
                cleaned[field] = 1;
            }
        }
    });

    // Convert decimal fields to numbers
    const decimalFields = [
        'purchase_price', 'offer_purchase_price', 'rent_to_buy_offer_purchase_price',
        'rent_percent_per_day', 'rent_price_per_day', 'rent_percent_per_month',
        'rent_price_per_month', 'offer_rent_price_per_month',
        'rent_percent_6_months', 'rent_price_6_months',
        'rent_percent_1_year', 'rent_price_1_year'
    ];
    
    decimalFields.forEach(field => {
        if (cleaned[field] !== undefined && cleaned[field] !== null && cleaned[field] !== '') {
            const num = parseFloat(cleaned[field]);
            cleaned[field] = isNaN(num) ? 0.00 : parseFloat(num.toFixed(2));
        } else {
            cleaned[field] = 0.00;
        }
    });

    // Auto-calculate rent prices if not provided
    const purchasePrice = parseFloat(cleaned.purchase_price) || 0;
    
    if (cleaned.rent_percent_per_month && (!cleaned.rent_price_per_month || cleaned.rent_price_per_month === 0)) {
        const percent = parseFloat(cleaned.rent_percent_per_month) || 0;
        cleaned.rent_price_per_month = parseFloat(((purchasePrice * percent) / 100).toFixed(2));
    }
    
    if (cleaned.rent_percent_6_months && (!cleaned.rent_price_6_months || cleaned.rent_price_6_months === 0)) {
        const percent = parseFloat(cleaned.rent_percent_6_months) || 0;
        cleaned.rent_price_6_months = parseFloat(((purchasePrice * percent) / 100).toFixed(2));
    }
    
    if (cleaned.rent_percent_1_year && (!cleaned.rent_price_1_year || cleaned.rent_price_1_year === 0)) {
        const percent = parseFloat(cleaned.rent_percent_1_year) || 0;
        cleaned.rent_price_1_year = parseFloat(((purchasePrice * percent) / 100).toFixed(2));
    }

    // Set defaults
    cleaned.is_deleted = 0;
    
    return cleaned;
}

// Validate product data
function validateProduct(productData) {
    const errors = [];
    
    // Required fields
    const requiredFields = [
        { field: 'product_name', name: 'Product Name' },
        { field: 'product_category', name: 'Product Category' },
        { field: 'purchase_price', name: 'Purchase Price' },
        { field: 'rent_percent_per_month', name: 'Rent Percent Per Month' }
    ];
    
    for (const req of requiredFields) {
        if (!productData[req.field] || 
            (typeof productData[req.field] === 'string' && productData[req.field].trim() === '') ||
            productData[req.field] === 0) {
            errors.push(`${req.name} is required`);
        }
    }

    // Validate purchase price
    if (productData.purchase_price && 
        (isNaN(productData.purchase_price) || productData.purchase_price <= 0)) {
        errors.push('Purchase Price must be a positive number');
    }

    // Validate rent percent
    if (productData.rent_percent_per_month && 
        (isNaN(productData.rent_percent_per_month) || 
         productData.rent_percent_per_month < 0 || 
         productData.rent_percent_per_month > 100)) {
        errors.push('Rent Percent Per Month must be between 0-100');
    }

    return errors;
}

// Clean up uploaded file
function cleanupUploadedFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error('✗ Error cleaning up file:', error.message);
    }
}

// Alternative: Single endpoint that accepts JSON array
export const bulkCreateProducts = async (req, res) => {
    try {
        const {
            products
        } = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of products'
            });
        }

        if (products.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 1000 products allowed per request'
            });
        }

        const results = {
            total: products.length,
            success: 0,
            failed: 0,
            errors: [],
            createdProducts: []
        };

        // Process each product
        for (let i = 0; i < products.length; i++) {
            try {
                const productData = cleanProductData(products[i]);
                const validationErrors = validateProduct(productData);

                if (validationErrors.length > 0) {
                    results.failed++;
                    results.errors.push({
                        index: i,
                        productName: productData.product_name || 'Unknown',
                        errors: validationErrors
                    });
                    continue;
                }

                // Create product
                const product = await ProductTemplete.create(productData);
                results.success++;
                results.createdProducts.push({
                    id: product.id,
                    product_id: product.product_id,
                    product_name: product.product_name
                });

            } catch (rowError) {
                results.failed++;
                results.errors.push({
                    index: i,
                    productName: products[i]?.product_name || 'Unknown',
                    errors: [rowError.message || 'Unknown error occurred']
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Bulk create completed: ${results.success} of ${results.total} products created successfully`,
            summary: results
        });

    } catch (error) {
        console.error('Bulk create error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating products in bulk',
            error: error.message
        });
    }
};







// Download product template (Excel format) WITH ACTUAL DATA
export const downloadProductTemplate = async (req, res) => {
    try {

        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `Product_Template_With_Data_${timestamp}.xlsx`;

        // Create workbook
        const wb = xlsx.utils.book_new();

        // ====================
        // 1. GET ACTUAL TABLE COLUMNS
        // ====================
        try {
            // Get column structure
            const columns = await db.sequelize.query(
                `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = :databaseName 
         AND TABLE_NAME = 'products_templete'
         ORDER BY ORDINAL_POSITION`, {
                    replacements: {
                        databaseName: process.env.DB_NAME
                    },
                    type: db.sequelize.QueryTypes.SELECT
                }
            );


            // ====================
            // 2. GET ACTUAL PRODUCT DATA
            // ====================
            const products = await db.ProductTemplete.findAll({
                limit: 1000, // Limit to 100 products
                order: [
                    ['id', 'ASC']
                ],
                raw: true // Get plain objects
            });


            // ====================
            // 3. CREATE TEMPLATE WITH ACTUAL DATA
            // ====================
            const headers = columns.map(col => col.COLUMN_NAME);

            // Create data array: headers + actual product data
            const data = [headers]; // Start with headers

            // Add actual product data rows
            products.forEach(product => {
                const row = headers.map(header => {
                    const value = product[header];

                    // Format values for Excel
                    if (value === null || value === undefined) {
                        return '';
                    }

                    // Handle boolean values
                    if (typeof value === 'boolean') {
                        return value ? 'true' : 'false';
                    }

                    // Handle dates
                    if (value instanceof Date) {
                        return value.toISOString().split('T')[0]; // YYYY-MM-DD format
                    }

                    // Return as string
                    return String(value);
                });
                data.push(row);
            });

            // If no products found, add sample placeholder
            if (products.length === 0) {
                const sampleRow = headers.map(header => {
                    // Add sample values based on column type
                    if (header === 'product_id') return 'PRD-XXXXX';
                    if (header === 'product_name') return 'Sample Product';
                    if (header === 'product_category') return 'Laptop';
                    if (header === 'purchase_price') return '10000.00';
                    if (header === 'rent_percent_per_month') return '10.00';
                    if (header.includes('price')) return '0.00';
                    if (header.includes('percent')) return '0.00';
                    if (header === 'is_active') return 'true';
                    if (header === 'created_at' || header === 'updated_at') {
                        return new Date().toISOString().split('T')[0];
                    }
                    return '';
                });
                data.push(sampleRow);
            }

            // Create worksheet with headers and data
            const ws = xlsx.utils.aoa_to_sheet(data);

            // Style headers
            const range = xlsx.utils.decode_range(ws['!ref']);
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = xlsx.utils.encode_cell({
                    r: 0,
                    c: C
                });
                if (ws[cellAddress]) {
                    const column = columns[C];
                    const isNullable = column.IS_NULLABLE === 'YES';

                    // Style header row
                    ws[cellAddress].s = {
                        font: {
                            bold: true,
                            color: {
                                rgb: isNullable ? "000000" : "FF0000"
                            },
                            sz: 11
                        },
                        fill: {
                            fgColor: {
                                rgb: isNullable ? "F0F0F0" : "FFFFCC"
                            }
                        },
                        alignment: {
                            vertical: 'center',
                            horizontal: 'center',
                            wrapText: false
                        },
                        border: {
                            top: {
                                style: 'thin',
                                color: {
                                    rgb: "000000"
                                }
                            },
                            bottom: {
                                style: 'thin',
                                color: {
                                    rgb: "000000"
                                }
                            },
                            left: {
                                style: 'thin',
                                color: {
                                    rgb: "000000"
                                }
                            },
                            right: {
                                style: 'thin',
                                color: {
                                    rgb: "000000"
                                }
                            }
                        }
                    };
                }
            }

            // Style data rows
            for (let R = 1; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = xlsx.utils.encode_cell({
                        r: R,
                        c: C
                    });
                    if (ws[cellAddress]) {
                        // Alternate row colors
                        const bgColor = R % 2 === 0 ? "FFFFFF" : "F9F9F9";

                        ws[cellAddress].s = {
                            font: {
                                color: {
                                    rgb: "000000"
                                },
                                sz: 10
                            },
                            fill: {
                                fgColor: {
                                    rgb: bgColor
                                }
                            },
                            alignment: {
                                vertical: 'center',
                                horizontal: 'left'
                            },
                            border: {
                                left: {
                                    style: 'thin',
                                    color: {
                                        rgb: "E0E0E0"
                                    }
                                },
                                right: {
                                    style: 'thin',
                                    color: {
                                        rgb: "E0E0E0"
                                    }
                                },
                                bottom: {
                                    style: 'thin',
                                    color: {
                                        rgb: "E0E0E0"
                                    }
                                }
                            }
                        };
                    }
                }
            }

            // Freeze header row (so headers stay visible when scrolling)
            ws['!freeze'] = {
                xSplit: 0,
                ySplit: 1,
                topLeftCell: 'A2',
                activePane: 'bottomLeft'
            };

            // Set column widths
            const colWidths = headers.map(header => ({
                wch: Math.min(Math.max(header.length, 12), 25)
            }));
            ws['!cols'] = colWidths;

            // Auto-filter on headers
            ws['!autofilter'] = {
                ref: `A1:${xlsx.utils.encode_cell({r: 0, c: headers.length - 1})}`
            };

            xlsx.utils.book_append_sheet(wb, ws, 'Products');

            // ====================
            // 4. CREATE EMPTY TEMPLATE SHEET
            // ====================
            // Create a second sheet with just headers (for fresh template)
            const emptyData = [headers];
            const wsEmpty = xlsx.utils.aoa_to_sheet(emptyData);

            // Style empty template headers
            const emptyRange = xlsx.utils.decode_range(wsEmpty['!ref']);
            for (let C = emptyRange.s.c; C <= emptyRange.e.c; ++C) {
                const cellAddress = xlsx.utils.encode_cell({
                    r: 0,
                    c: C
                });
                if (wsEmpty[cellAddress]) {
                    const column = columns[C];
                    const isNullable = column.IS_NULLABLE === 'YES';

                    wsEmpty[cellAddress].s = {
                        font: {
                            bold: true,
                            color: {
                                rgb: isNullable ? "000000" : "FF0000"
                            },
                            sz: 11
                        },
                        fill: {
                            fgColor: {
                                rgb: isNullable ? "F0F0F0" : "FFFFCC"
                            }
                        },
                        alignment: {
                            vertical: 'center',
                            horizontal: 'center'
                        },
                        border: {
                            top: {
                                style: 'thin',
                                color: {
                                    rgb: "000000"
                                }
                            },
                            bottom: {
                                style: 'thin',
                                color: {
                                    rgb: "000000"
                                }
                            },
                            left: {
                                style: 'thin',
                                color: {
                                    rgb: "000000"
                                }
                            },
                            right: {
                                style: 'thin',
                                color: {
                                    rgb: "000000"
                                }
                            }
                        }
                    };
                }
            }

            wsEmpty['!cols'] = colWidths;
            xlsx.utils.book_append_sheet(wb, wsEmpty, 'Empty Template');

            // ====================
            // 5. CREATE INSTRUCTIONS SHEET
            // ====================
            const instructions = createInstructions(columns, products.length);
            const wsInstructions = xlsx.utils.aoa_to_sheet(instructions);
            wsInstructions['!cols'] = [{
                wch: 100
            }];
            xlsx.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

            // ====================
            // 6. CREATE COLUMNS REFERENCE SHEET
            // ====================
            const columnReference = createColumnReference(columns);
            const wsReference = xlsx.utils.aoa_to_sheet(columnReference);
            wsReference['!cols'] = [{
                    wch: 25
                }, // Column Name
                {
                    wch: 15
                }, // Data Type
                {
                    wch: 10
                }, // Required
                {
                    wch: 15
                }, // Default
                {
                    wch: 30
                } // Description
            ];
            xlsx.utils.book_append_sheet(wb, wsReference, 'Column Reference');

            // ====================
            // 7. SAVE AND SEND FILE
            // ====================
            const buffer = xlsx.write(wb, {
                type: 'buffer',
                bookType: 'xlsx'
            });

            // Set response headers
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Length', buffer.length);

            // Send file
            res.send(buffer);

        } catch (dbError) {
            console.error('❌ Database error:', dbError.message);
            // Fallback to simple template
            return createSimpleTemplateWithSampleData(res, fileName, wb);
        }

    } catch (error) {
        console.error('❌ Error generating template:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error generating product template',
            error: error.message
        });
    }
};

// Updated instructions with data info
const createInstructions = (columns, productCount) => {
    const requiredColumns = columns.filter(col => col.IS_NULLABLE === 'NO').map(col => col.COLUMN_NAME);

    return [
        ['📋 PRODUCT TEMPLATE INSTRUCTIONS'],
        [''],
        ['=== DATABASE INFORMATION ==='],
        [`Table Name: products_templete`],
        [`Total Columns: ${columns.length}`],
        [`Required Columns: ${requiredColumns.length}`],
        [`Current Products in Database: ${productCount}`],
        [''],
        ['=== HOW TO USE ==='],
        ['1. "Products" sheet contains actual data from your database'],
        ['2. "Empty Template" sheet has just headers for new entries'],
        ['3. Copy data from Products sheet to Empty Template if needed'],
        ['4. Fill ONLY the columns you need'],
        ['5. Save as .xlsx format before uploading'],
        ['6. Upload via Bulk Upload feature'],
        [''],
        ['=== IMPORTANT NOTES ==='],
        ['• Leave product_id empty to auto-generate'],
        ['• Boolean fields: Use "true" or "false" (or 1/0)'],
        ['• Price fields: Numbers only, no currency symbols'],
        ['• Date fields: Use YYYY-MM-DD format'],
        [''],
        ['=== REQUIRED FIELDS ==='],
        ...requiredColumns.map(col => [`• ${col}`]),
        [''],
        ['=== TIPS ==='],
        ['• Use filters on the Products sheet to view specific products'],
        ['• Frozen headers stay visible when scrolling'],
        ['• Alternate row colors for better readability'],
        [''],
        ['=== SUPPORT ==='],
        ['For assistance, contact your system administrator.']
    ];
};

// Fallback template with sample data
const createSimpleTemplateWithSampleData = (res, fileName, wb) => {

    const headers = [
        'product_category', 'product_name', 'product_id', 'brand', 'model',
        'description', 'purchase_price', 'rent_percent_per_month',
        'ram', 'storage', 'os', 'display_size', 'processor', 'generation',
        'graphics', 'disk_type', 'motherboard', 'cabinet', 'smps',
        'is_active', 'hsn_code', 'created_at'
    ];

    // Sample product data
    const sampleData = [
        // Row 1: Laptop
        [
            'Laptop', 'Dell Latitude 3450', 'PRD-LT001', 'Dell', 'Latitude 3450',
            '14 inch business laptop', '45000.00', '10.00',
            '8', '512', 'Windows 11', '14', 'Intel Core i5', '11th Gen',
            'Intel Iris Xe', 'SSD', 'Dell Proprietary', 'Aluminum', '65W',
            'true', '84713000', new Date().toISOString().split('T')[0]
        ],
        // Row 2: RAM
        [
            'RAM', 'Corsair 8GB DDR4', 'PRD-RM001', 'Corsair', 'CMK8GX4M1A2400C16',
            '8GB DDR4 RAM module', '2500.00', '15.00',
            '8', '', '', '', '', '',
            '', '', '', '', '',
            'true', '85423100', new Date().toISOString().split('T')[0]
        ],
        // Row 3: Desktop
        [
            'Desktop', 'HP ProDesk 400', 'PRD-DT001', 'HP', 'ProDesk 400',
            'Mini desktop PC', '35000.00', '12.00',
            '16', '1TB', 'Windows 10 Pro', '', 'Intel Core i7', '10th Gen',
            'Intel UHD Graphics', 'HDD', 'HP Proprietary', 'Mini Tower', '180W',
            'true', '84714100', new Date().toISOString().split('T')[0]
        ]
    ];

    // Combine headers and sample data
    const data = [headers, ...sampleData];
    const ws = xlsx.utils.aoa_to_sheet(data);

    // Style the sheet
    const range = xlsx.utils.decode_range(ws['!ref']);
    for (let R = 0; R <= range.e.r; R++) {
        for (let C = 0; C <= range.e.c; C++) {
            const cellAddress = xlsx.utils.encode_cell({
                r: R,
                c: C
            });
            if (ws[cellAddress]) {
                if (R === 0) {
                    // Header row
                    ws[cellAddress].s = {
                        font: {
                            bold: true,
                            color: {
                                rgb: "000000"
                            },
                            sz: 11
                        },
                        fill: {
                            fgColor: {
                                rgb: "F0F0F0"
                            }
                        },
                        alignment: {
                            vertical: 'center',
                            horizontal: 'center'
                        },
                        border: {
                            top: {
                                style: 'thin',
                                color: {
                                    rgb: "000000"
                                }
                            },
                            bottom: {
                                style: 'thin',
                                color: {
                                    rgb: "000000"
                                }
                            },
                            left: {
                                style: 'thin',
                                color: {
                                    rgb: "000000"
                                }
                            },
                            right: {
                                style: 'thin',
                                color: {
                                    rgb: "000000"
                                }
                            }
                        }
                    };
                } else {
                    // Data rows
                    const bgColor = R % 2 === 0 ? "FFFFFF" : "F9F9F9";
                    ws[cellAddress].s = {
                        font: {
                            color: {
                                rgb: "000000"
                            },
                            sz: 10
                        },
                        fill: {
                            fgColor: {
                                rgb: bgColor
                            }
                        },
                        alignment: {
                            vertical: 'center',
                            horizontal: 'left'
                        },
                        border: {
                            left: {
                                style: 'thin',
                                color: {
                                    rgb: "E0E0E0"
                                }
                            },
                            right: {
                                style: 'thin',
                                color: {
                                    rgb: "E0E0E0"
                                }
                            },
                            bottom: {
                                style: 'thin',
                                color: {
                                    rgb: "E0E0E0"
                                }
                            }
                        }
                    };
                }
            }
        }
    }

    // Set column widths
    const colWidths = headers.map(header => ({
        wch: Math.min(Math.max(header.length, 12), 20)
    }));
    ws['!cols'] = colWidths;

    xlsx.utils.book_append_sheet(wb, ws, 'Sample Products');

    const buffer = xlsx.write(wb, {
        type: 'buffer',
        bookType: 'xlsx'
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    res.send(buffer);
};