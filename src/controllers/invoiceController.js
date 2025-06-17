import db from '../models/index.js';
import {
    Op
} from 'sequelize';

const Invoice = db.Invoice;
const InvoiceItem = db.InvoiceItem;
const InvoiceShippingDetail = db.InvoiceShippingDetail;
const ProductTemplete = db.ProductTemplete;
const TaxType = db.TaxType;

const Order = db.Order;
const OrderItem = db.OrderItem;


export const createInvoice = async (req, res) => {
    try {
        // Validate required fields
        if (!req.body.items || !req.body.items.length) {
            return res.status(400).json({
                error: "At least one invoice item is required"
            });
        }

        // Destructure request body
        const {
            order_id,
            invoice_number,
            invoice_title,
            invoice_start_date,
            invoice_end_date,
            previous_delivered_start_date,
            previous_delivered_end_date,
            credit_note_start_date,
            credit_note_end_date,
            duration,
            rental_duration_months,
            rental_duration_days,
            rental_start_date,
            rental_end_date,
            purchase_order_date,
            purchase_order_number,
            customer_id,
            customer_name,
            customer_gst_number,
            pan_number,
            phone_number,
            email,
            industry,
            payment_mode,
            payment_terms,
            invoice_date,
            invoice_due_date,
            approval_status,
            approval_date,
            remarks,
            invoice_consulting_by,
            shippingDetails,
            items
        } = req.body;

        // Enhanced date formatter
        const formatDate = (input) => {
            if (!input) return null;

            // Handle multiple date formats (dd-mm-yyyy, yyyy-mm-dd, etc.)
            const dateParts = input.toString().split(/[-/]/);
            if (dateParts.length !== 3) return null;

            // Determine format (day-first or year-first)
            const isDayFirst = dateParts[0].length <= 2;
            const day = isDayFirst ? dateParts[0] : dateParts[2];
            const month = dateParts[1];
            const year = isDayFirst ? dateParts[2] : dateParts[0];

            const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            return isNaN(new Date(formattedDate).getTime()) ? null : formattedDate;
        };

        const getCurrentTimestamp = () => {
            const now = new Date();
            return now.toISOString().replace('T', ' ').slice(0, 19); // "YYYY-MM-DD HH:MM:SS"
        };

        // Format all dates
        const formattedInvoiceStartDate = formatDate(invoice_start_date);
        const formattedInvoiceEndDate = formatDate(invoice_end_date);
        const formattedInvoiceDate = formatDate(invoice_date) || getCurrentTimestamp();
        const formattedInvoiceDueDate = formatDate(invoice_due_date);
        const formattedPreviousStart = formatDate(previous_delivered_start_date);
        const formattedPreviousEnd = formatDate(previous_delivered_end_date);
        const formattedCreditStart = formatDate(credit_note_start_date);
        const formattedCreditEnd = formatDate(credit_note_end_date);
        const formattedRentalStart = formatDate(rental_start_date);
        const formattedRentalEnd = formatDate(rental_end_date);
        const formattedPurchaseOrderDate = formatDate(purchase_order_date);
        const formattedApprovalDate = formatDate(approval_date);

        // Validate critical dates
        if (!formattedInvoiceStartDate || !formattedInvoiceEndDate) {
            return res.status(400).json({
                error: "Invalid invoice date range provided"
            });
        }

        // Calculate total days in invoice period
        const startDate = new Date(formattedInvoiceStartDate);
        const endDate = new Date(formattedInvoiceEndDate);
        const totalInvoiceDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        if (totalInvoiceDays <= 0) {
            return res.status(400).json({
                error: "Invoice end date must be after start date"
            });
        }

        // Get tax rates
        const tax = await TaxType.findOne({
            where: {
                tax_type_name: {
                    [Op.like]: '%GST%'
                }
            },
        });

        const taxRate = tax ? tax.percentage : 18;
        const cgstRate = taxRate / 2;
        const sgstRate = taxRate / 2;

        // Create invoice with initial zero amounts
        const invoice = await Invoice.create({
            order_id,
            invoice_number,
            invoice_title,
            invoice_date: formattedInvoiceDate,
            invoice_due_date: formattedInvoiceDueDate,
            invoice_start_date: formattedInvoiceStartDate,
            invoice_end_date: formattedInvoiceEndDate,
            previous_delivered_start_date: formattedPreviousStart,
            previous_delivered_end_date: formattedPreviousEnd,
            credit_note_start_date: formattedCreditStart,
            credit_note_end_date: formattedCreditEnd,
            duration,
            rental_duration_months: rental_duration_months || 0,
            rental_duration_days: rental_duration_days || 0,
            rental_start_date: formattedRentalStart,
            rental_end_date: formattedRentalEnd,
            purchase_order_date: formattedPurchaseOrderDate,
            purchase_order_number,
            customer_id,
            customer_name,
            customer_gst_number,
            email,
            phone_number,
            pan_number,
            payment_terms,
            payment_mode,
            approval_status: approval_status || "Pending",
            approval_date: formattedApprovalDate || getCurrentTimestamp(),
            amount: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            total_tax: 0,
            total_amount: 0,
            invoice_consulting_by,
            industry,
            remarks,
            created_at: getCurrentTimestamp(),
        });

        let invoiceAmount = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;

        // Process each invoice item
        for (const item of items) {
            const product = await ProductTemplete.findByPk(item.product_id);
            if (!product) {
                console.warn(`Product not found for ID: ${item.product_id}`);
                continue;
            }

            const rentPerMonth = parseFloat(product.rent_price_per_month || 0);
            const dailyRate = rentPerMonth / 30; // Standard 30-day month

            const prevQty = parseInt(item.previous_quantity || 0);
            const newQty = parseInt(item.new_quantity || 0);
            const returnQty = parseInt(item.return_quantity || 0);
            const months = parseInt(item.rental_duration_months || 0);
            const days = parseInt(item.rental_duration_days || 0);

            let total_price = 0;

            // 1. Previous quantity calculation (full period)
            if (prevQty > 0) {
                total_price += rentPerMonth * prevQty * months;
                total_price += dailyRate * prevQty * days;
            }

            // 2. New quantity calculation (prorated from added date)
            if (newQty > 0) {
                const addedDate = item.added_date ?
                    new Date(formatDate(item.added_date)) :
                    startDate;

                const effectiveDays = Math.ceil(
                    (endDate - addedDate) / (1000 * 60 * 60 * 24)) + 1;

                total_price += dailyRate * newQty * Math.max(0, effectiveDays);
            }

            // 3. Return quantity calculation (prorated to returned date)
            if (returnQty > 0) {
                const returnedDate = item.returned_date ?
                    new Date(formatDate(item.returned_date)) :
                    endDate;

                const usedDays = Math.ceil(
                    (returnedDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

                total_price += dailyRate * returnQty * Math.min(usedDays, totalInvoiceDays);
            }

            // Calculate taxes
            const cgst = parseFloat((total_price * cgstRate) / 100);
            const sgst = parseFloat((total_price * sgstRate) / 100);
            const total_tax = cgst + sgst;
            const total_amount = total_price + total_tax;

            // Update invoice totals
            invoiceAmount += total_price;
            totalCGST += cgst;
            totalSGST += sgst;

            // Create invoice item record
            await InvoiceItem.create({
                invoice_id: invoice.id,
                product_id: item.product_id,
                product_name: item.product_name || product.product_name,
                previous_quantity: prevQty,
                quantity: prevQty,
                unit_price: rentPerMonth.toFixed(2),
                total_price: total_price.toFixed(2),
                cgst: cgst.toFixed(2),
                sgst: sgst.toFixed(2),
                igst: "0.00",
                total_tax: total_tax.toFixed(2),
                total_amount: total_amount.toFixed(2),
                rental_duration_months: months,
                rental_duration_days: days,
                new_quantity: newQty,
                return_quantity: returnQty,
                new_device_ids: item.new_device_ids || [],
                returned_device_ids: item.returned_device_ids || [],

                added_date: item.new_quantity && Number(item.new_quantity) !== 0 ?
                    item.added_date ?
                    formatDate(item.added_date) :
                    getCurrentTimestamp() : null,

                returned_date: item.return_quantity && Number(item.return_quantity) !== 0 ?
                    item.returned_date ?
                    formatDate(item.returned_date) :
                    getCurrentTimestamp() : null,

            });
        }

        // Calculate final invoice amounts
        const grandTotal = invoiceAmount + totalCGST + totalSGST;

        // Update invoice with final amounts
        await invoice.update({
            amount: parseFloat(invoiceAmount.toFixed(2)),
            cgst: parseFloat(totalCGST.toFixed(2)),
            sgst: parseFloat(totalSGST.toFixed(2)),
            igst: parseFloat(totalIGST.toFixed(2)),
            total_tax: parseFloat((totalCGST + totalSGST).toFixed(2)),
            total_amount: parseFloat(grandTotal.toFixed(2)),
        });

        // Add shipping details if provided
        if (shippingDetails) {
            await InvoiceShippingDetail.create({
                invoice_id: invoice.id,
                consignee_name: shippingDetails.consignee_name || customer_name,
                country: shippingDetails.country || "India",
                state: shippingDetails.state,
                city: shippingDetails.city,
                street: shippingDetails.street,
                landmark: shippingDetails.landmark,
                pincode: shippingDetails.pincode,
                phone_number: shippingDetails.phone_number || phone_number,
                email: shippingDetails.email || email,
            });
        }

        return res.status(201).json({
            success: true,
            message: "Invoice created successfully",
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            total_amount: grandTotal.toFixed(2),
            breakdown: {
                subtotal: invoiceAmount.toFixed(2),
                cgst: totalCGST.toFixed(2),
                sgst: totalSGST.toFixed(2),
                igst: totalIGST.toFixed(2)
            }
        });

    } catch (error) {
        console.error("Error creating invoice:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to create invoice",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// Get all invoices
export const getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.findAll();
        res.status(200).json(invoices);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error fetching invoices",
            error
        });
    }
};

export const getInvoiceById = async (req, res) => {
    try {
        const {
            id
        } = req.params;

        // Step 1: Fetch invoice with items and product details
        const invoice = await Invoice.findByPk(id, {
            include: [{
                    model: InvoiceItem,
                    as: 'items',
                    include: [{
                        model: ProductTemplete,
                        as: 'productDetails',
                    }, ],
                },
                {
                    model: InvoiceShippingDetail,
                    as: 'shippingDetail',
                },
            ],
        });

        if (!invoice) {
            return res.status(404).json({
                message: 'Invoice not found'
            });
        }

        // Step 2: Fetch the order using order_id from invoice.purchase_order_number
        const order = await Order.findOne({
            where: {
                order_id: invoice.purchase_order_number,
                order_status: 'Approved'
            },
        });

        // Step 3: Fetch order_products using internal order.id (not order_id string)
        let deviceIdMap = {};
        if (order) {
            const orderProducts = await OrderItem.findAll({
                where: {
                    order_id: order.id
                },
            });

            // Map product_id → device_ids (already parsed by model getter)
            orderProducts.forEach(op => {
                let deviceIds = [];

                if (Array.isArray(op.device_ids)) {
                    // device_ids already parsed to array via model getter
                    deviceIds = op.device_ids;
                } else if (typeof op.device_ids === 'string') {
                    try {
                        // Try parsing as JSON
                        deviceIds = JSON.parse(op.device_ids);
                    } catch {
                        // If it's a plain string, fallback to split
                        deviceIds = op.device_ids.split(',').map(id => id.trim());
                    }
                }

                deviceIdMap[op.product_id] = deviceIds;
            });
        }

        // Step 4: Attach device_ids to invoice items
        const updatedItems = invoice.items.map(item => {
            const device_ids = deviceIdMap[item.product_id] || [];
            return {
                ...item.toJSON(),
                device_ids,
            };
        });

        // Step 5: Return updated invoice
        const invoiceJSON = invoice.toJSON();
        invoiceJSON.items = updatedItems;

        res.status(200).json(invoiceJSON);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({
            message: 'Internal server error',
            error
        });
    }
};




// Update invoice with full functionality
export const updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        
       // Find the existing invoice with proper association aliases
        const invoice = await Invoice.findByPk(id, {
            include: [
                { 
                    model: InvoiceItem,
                    as: 'items' // Make sure this matches your association alias
                },
                { 
                    model: InvoiceShippingDetail,
                    as: 'shippingDetail' // Make sure this matches your association alias
                }
            ]
        });
        
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }
        // Validate required fields
        if (!req.body.items || !req.body.items.length) {
            return res.status(400).json({
                error: "At least one invoice item is required"
            });
        }

        // Destructure request body
        const {
            order_id,
            invoice_number,
            invoice_title,
            invoice_start_date,
            invoice_end_date,
            previous_delivered_start_date,
            previous_delivered_end_date,
            credit_note_start_date,
            credit_note_end_date,
            duration,
            rental_duration_months,
            rental_duration_days,
            rental_start_date,
            rental_end_date,
            purchase_order_date,
            purchase_order_number,
            customer_id,
            customer_name,
            customer_gst_number,
            pan_number,
            phone_number,
            email,
            industry,
            payment_mode,
            payment_terms,
            invoice_date,
            invoice_due_date,
            approval_status,
            approval_date,
            remarks,
            invoice_consulting_by,
            shippingDetails,
            items
        } = req.body;

        // Reuse the same date formatting from create
        const formatDate = (input) => {
            if (!input) return null;
            const dateParts = input.toString().split(/[-/]/);
            if (dateParts.length !== 3) return null;
            const isDayFirst = dateParts[0].length <= 2;
            const day = isDayFirst ? dateParts[0] : dateParts[2];
            const month = dateParts[1];
            const year = isDayFirst ? dateParts[2] : dateParts[0];
            const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            return isNaN(new Date(formattedDate).getTime()) ? null : formattedDate;
        };

        const getCurrentTimestamp = () => {
            const now = new Date();
            return now.toISOString().replace('T', ' ').slice(0, 19);
        };

        // Format all dates
        const formattedInvoiceStartDate = formatDate(invoice_start_date);
        const formattedInvoiceEndDate = formatDate(invoice_end_date);
        const formattedInvoiceDate = formatDate(invoice_date) || getCurrentTimestamp();
        const formattedInvoiceDueDate = formatDate(invoice_due_date);
        const formattedPreviousStart = formatDate(previous_delivered_start_date);
        const formattedPreviousEnd = formatDate(previous_delivered_end_date);
        const formattedCreditStart = formatDate(credit_note_start_date);
        const formattedCreditEnd = formatDate(credit_note_end_date);
        const formattedRentalStart = formatDate(rental_start_date);
        const formattedRentalEnd = formatDate(rental_end_date);
        const formattedPurchaseOrderDate = formatDate(purchase_order_date);
        const formattedApprovalDate = formatDate(approval_date);

        // Validate critical dates
        if (!formattedInvoiceStartDate || !formattedInvoiceEndDate) {
            return res.status(400).json({
                error: "Invalid invoice date range provided"
            });
        }

        // Calculate total days in invoice period
        const startDate = new Date(formattedInvoiceStartDate);
        const endDate = new Date(formattedInvoiceEndDate);
        const totalInvoiceDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        if (totalInvoiceDays <= 0) {
            return res.status(400).json({
                error: "Invoice end date must be after start date"
            });
        }

        // Get tax rates
        const tax = await TaxType.findOne({
            where: {
                tax_type_name: {
                    [Op.like]: '%GST%'
                }
            },
        });

        const taxRate = tax ? tax.percentage : 18;
        const cgstRate = taxRate / 2;
        const sgstRate = taxRate / 2;

        // Update invoice basic information
        await invoice.update({
            order_id,
            invoice_number,
            invoice_title,
            invoice_date: formattedInvoiceDate,
            invoice_due_date: formattedInvoiceDueDate,
            invoice_start_date: formattedInvoiceStartDate,
            invoice_end_date: formattedInvoiceEndDate,
            previous_delivered_start_date: formattedPreviousStart,
            previous_delivered_end_date: formattedPreviousEnd,
            credit_note_start_date: formattedCreditStart,
            credit_note_end_date: formattedCreditEnd,
            duration,
            rental_duration_months: rental_duration_months || 0,
            rental_duration_days: rental_duration_days || 0,
            rental_start_date: formattedRentalStart,
            rental_end_date: formattedRentalEnd,
            purchase_order_date: formattedPurchaseOrderDate,
            purchase_order_number,
            customer_id,
            customer_name,
            customer_gst_number,
            email,
            phone_number,
            pan_number,
            payment_terms,
            payment_mode,
            approval_status: approval_status || invoice.approval_status || "Pending",
            approval_date: formattedApprovalDate || invoice.approval_date || getCurrentTimestamp(),
            invoice_consulting_by,
            industry,
            remarks,
            updated_at: getCurrentTimestamp(),
        });

        let invoiceAmount = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;

        // First, delete all existing invoice items
        await InvoiceItem.destroy({
            where: { invoice_id: invoice.id }
        });

        // Process each new invoice item
        for (const item of items) {
            const product = await ProductTemplete.findByPk(item.product_id);
            if (!product) {
                console.warn(`Product not found for ID: ${item.product_id}`);
                continue;
            }

            const rentPerMonth = parseFloat(product.rent_price_per_month || 0);
            const dailyRate = rentPerMonth / 30; // Standard 30-day month

            const prevQty = parseInt(item.previous_quantity || 0);
            const newQty = parseInt(item.new_quantity || 0);
            const returnQty = parseInt(item.return_quantity || 0);
            const months = parseInt(item.rental_duration_months || 0);
            const days = parseInt(item.rental_duration_days || 0);

            let total_price = 0;

            // 1. Previous quantity calculation (full period)
            if (prevQty > 0) {
                total_price += rentPerMonth * prevQty * months;
                total_price += dailyRate * prevQty * days;
            }

            // 2. New quantity calculation (prorated from added date)
            if (newQty > 0) {
                const addedDate = item.added_date ?
                    new Date(formatDate(item.added_date)) :
                    startDate;

                const effectiveDays = Math.ceil(
                    (endDate - addedDate) / (1000 * 60 * 60 * 24)) + 1;

                total_price += dailyRate * newQty * Math.max(0, effectiveDays);
            }

            // 3. Return quantity calculation (prorated to returned date)
            if (returnQty > 0) {
                const returnedDate = item.returned_date ?
                    new Date(formatDate(item.returned_date)) :
                    endDate;

                const usedDays = Math.ceil(
                    (returnedDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

                total_price += dailyRate * returnQty * Math.min(usedDays, totalInvoiceDays);
            }

            // Calculate taxes
            const cgst = parseFloat((total_price * cgstRate) / 100);
            const sgst = parseFloat((total_price * sgstRate) / 100);
            const total_tax = cgst + sgst;
            const total_amount = total_price + total_tax;

            // Update invoice totals
            invoiceAmount += total_price;
            totalCGST += cgst;
            totalSGST += sgst;

            // Create invoice item record
            await InvoiceItem.create({
                invoice_id: invoice.id,
                product_id: item.product_id,
                product_name: item.product_name || product.product_name,
                previous_quantity: prevQty,
                quantity: prevQty,
                unit_price: rentPerMonth.toFixed(2),
                total_price: total_price.toFixed(2),
                cgst: cgst.toFixed(2),
                sgst: sgst.toFixed(2),
                igst: "0.00",
                total_tax: total_tax.toFixed(2),
                total_amount: total_amount.toFixed(2),
                rental_duration_months: months,
                rental_duration_days: days,
                new_quantity: newQty,
                return_quantity: returnQty,
                new_device_ids: item.new_device_ids || [],
                returned_device_ids: item.returned_device_ids || [],
                added_date: item.new_quantity && Number(item.new_quantity) !== 0 ?
                    item.added_date ?
                    formatDate(item.added_date) :
                    getCurrentTimestamp() : null,
                returned_date: item.return_quantity && Number(item.return_quantity) !== 0 ?
                    item.returned_date ?
                    formatDate(item.returned_date) :
                    getCurrentTimestamp() : null,
            });
        }

        // Calculate final invoice amounts
        const grandTotal = invoiceAmount + totalCGST + totalSGST;

        // Update invoice with final amounts
        await invoice.update({
            amount: parseFloat(invoiceAmount.toFixed(2)),
            cgst: parseFloat(totalCGST.toFixed(2)),
            sgst: parseFloat(totalSGST.toFixed(2)),
            igst: parseFloat(totalIGST.toFixed(2)),
            total_tax: parseFloat((totalCGST + totalSGST).toFixed(2)),
            total_amount: parseFloat(grandTotal.toFixed(2)),
        });

        // Handle shipping details update
        if (shippingDetails) {
            if (invoice.InvoiceShippingDetail) {
                // Update existing shipping details
                await invoice.InvoiceShippingDetail.update({
                    consignee_name: shippingDetails.consignee_name || customer_name,
                    country: shippingDetails.country || "India",
                    state: shippingDetails.state,
                    city: shippingDetails.city,
                    street: shippingDetails.street,
                    landmark: shippingDetails.landmark,
                    pincode: shippingDetails.pincode,
                    phone_number: shippingDetails.phone_number || phone_number,
                    email: shippingDetails.email || email,
                });
            } else {
                // Create new shipping details if none existed
                await InvoiceShippingDetail.create({
                    invoice_id: invoice.id,
                    consignee_name: shippingDetails.consignee_name || customer_name,
                    country: shippingDetails.country || "India",
                    state: shippingDetails.state,
                    city: shippingDetails.city,
                    street: shippingDetails.street,
                    landmark: shippingDetails.landmark,
                    pincode: shippingDetails.pincode,
                    phone_number: shippingDetails.phone_number || phone_number,
                    email: shippingDetails.email || email,
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Invoice updated successfully",
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            total_amount: grandTotal.toFixed(2),
            breakdown: {
                subtotal: invoiceAmount.toFixed(2),
                cgst: totalCGST.toFixed(2),
                sgst: totalSGST.toFixed(2),
                igst: totalIGST.toFixed(2)
            }
        });

    } catch (error) {
        console.error("Error updating invoice:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to update invoice",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// Delete invoice and related records
export const deleteInvoice = async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const invoice = await Invoice.findByPk(id);
        if (!invoice) return res.status(404).json({
            message: "Invoice not found"
        });

        await InvoiceItem.destroy({
            where: {
                invoice_id: id
            }
        });
        await InvoiceShippingDetail.destroy({
            where: {
                invoice_id: id
            }
        });
        await invoice.destroy();

        res.status(200).json({
            message: "Invoice and related records deleted successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error deleting invoice",
            error
        });
    }
};






// export const createInvoice = async (req, res) => {
//   try {
//     const {
//       invoice_number,
//       invoice_title,
//       customer_id,
//       customer_name,
//       invoice_date,
//       duration,
//       invoice_due_date,
//       rental_duration_months,
//       rental_duration_days,
//       purchase_order_date,
//       purchase_order_number,
//       customer_gst_number,
//       email,
//       phone_number,
//       pan_number,
//       payment_terms,
//       payment_mode,
//       approval_status,
//       approval_date,
//       invoice_consulting_by,
//       industry,
//       remarks,
//       invoice_start_date,
//       invoice_end_date,
//       previous_delivered_start_date,
//       previous_delivered_end_date,
//       credit_note_start_date,
//       credit_note_end_date,
//       rental_start_date,
//       rental_end_date,
//       items,
//       shippingDetails
//     } = req.body;

//    const formatDate = (input) => {
//   if (!input) return null;
//   const [dd, mm, yyyy] = input.split('-');
//   if (!dd || !mm || !yyyy) return null;
//   const iso = `${yyyy}-${mm}-${dd}`;
//   return isNaN(new Date(iso).getTime()) ? null : iso;
// };



// const invoice = await Invoice.create({
//   invoice_number,
//   invoice_title,
//   customer_id,
//   customer_name,
//   invoice_date,
//   invoice_due_date,
//   invoice_start_date,
//   invoice_end_date: formatDate(invoice_end_date),
//   previous_delivered_start_date: formatDate(previous_delivered_start_date),
//   previous_delivered_end_date: formatDate(previous_delivered_end_date),
//   credit_note_start_date: formatDate(credit_note_start_date),
//   credit_note_end_date: formatDate(credit_note_end_date),
//   rental_start_date: formatDate(rental_start_date),
//   rental_end_date: formatDate(rental_end_date),
//   duration,
//   rental_duration_months,
//   rental_duration_days,
//   purchase_order_date: formatDate(purchase_order_date),
//   purchase_order_number,
//   customer_gst_number,
//   email,
//   phone_number,
//   pan_number,
//   payment_terms,
//   payment_mode,
//   approval_status,
//   approval_date,
//   invoice_consulting_by,
//   industry,
//   remarks
// });




//     // Get GST rate (default 18%)
//     const gstType = await TaxType.findOne({
//       where: {
//         tax_type_name: {
//           [Op.like]: '%GST%'
//         }
//       }
//     });

//     const gstPercent = parseFloat(gstType?.percentage || 18);

//     // Invoice totals
//     let invoiceAmount = 0;
//     let totalCGST = 0;
//     let totalSGST = 0;
//     let totalIGST = 0;
//     let totalTax = 0;
//     let grandTotal = 0;

//     // Process items
//     for (const item of items) {
//   const product = await ProductTemplete.findByPk(item.product_id);
//   if (!product) continue;

//   const rentPerMonth = parseFloat(product.rent_price_per_month || 0);
//   const rentPerDay = rentPerMonth / 30;
//   const quantity = parseInt(item.quantity);

//   const totalMonths = parseInt(rental_duration_months || 0);
//   const totalDays = parseInt(rental_duration_days || 0);

//   // -----------------------------
//   // 1. CURRENT MONTH RENT
//   // -----------------------------
//   if (totalMonths > 0 || totalDays > 0) {
//     const basePrice = (rentPerMonth * totalMonths + rentPerDay * totalDays) * quantity;

//     const cgst = (basePrice * gstPercent / 2) / 100;
//     const sgst = (basePrice * gstPercent / 2) / 100;
//     const igst = 0;
//     const total_tax = cgst + sgst + igst;
//     const total_amount = basePrice + total_tax;

//     await InvoiceItem.create({
//       invoice_id: invoice.id,
//       product_id: item.product_id,
//       product_name: product.product_name + ' (Current Month)',
//       quantity,
//       unit_price: rentPerMonth,
//       total_price: basePrice,
//       cgst,
//       sgst,
//       igst,
//       total_tax,
//       total_amount
//     });

//     invoiceAmount += basePrice;
//     totalCGST += cgst;
//     totalSGST += sgst;
//     totalIGST += igst;
//     totalTax += total_tax;
//     grandTotal += total_amount;
//   }

//   // -----------------------------
//   // 2. PREVIOUS MONTH ADJUSTMENT
//   // -----------------------------
//   if (previous_delivered_start_date && previous_delivered_end_date) {
//     const start = new Date(formatDate(previous_delivered_start_date));
//     const end = new Date(formatDate(previous_delivered_end_date));
//     const prevDays = (end - start) / (1000 * 60 * 60 * 24) + 1; // Inclusive

//     if (prevDays > 0 && item.previous_quantity) {
//       const prevQty = parseInt(item.previous_quantity);
//       const prevBase = rentPerDay * prevDays * prevQty;

//       const cgst = (prevBase * gstPercent / 2) / 100;
//       const sgst = (prevBase * gstPercent / 2) / 100;
//       const igst = 0;
//       const total_tax = cgst + sgst + igst;
//       const total_amount = prevBase + total_tax;

//       await InvoiceItem.create({
//         invoice_id: invoice.id,
//         product_id: item.product_id,
//         product_name: product.product_name + ' (Previous Month Adjustment)',
//         quantity: prevQty,
//         unit_price: rentPerMonth,
//         total_price: prevBase,
//         cgst,
//         sgst,
//         igst,
//         total_tax,
//         total_amount
//       });

//       invoiceAmount += prevBase;
//       totalCGST += cgst;
//       totalSGST += sgst;
//       totalIGST += igst;
//       totalTax += total_tax;
//       grandTotal += total_amount;
//     }
//   }

//   // -----------------------------
//   // 3. CREDIT NOTE (Return Refund)
//   // -----------------------------
//   if (credit_note_start_date && credit_note_end_date) {
//     const start = new Date(formatDate(credit_note_start_date));
//     const end = new Date(formatDate(credit_note_end_date));
//     const creditDays = (end - start) / (1000 * 60 * 60 * 24) + 1; // Inclusive

//     if (creditDays > 0 && item.return_quantity) {
//       const returnQty = parseInt(item.return_quantity);
//       const creditBase = rentPerDay * creditDays * returnQty;

//       const cgst = (creditBase * gstPercent / 2) / 100;
//       const sgst = (creditBase * gstPercent / 2) / 100;
//       const igst = 0;
//       const total_tax = cgst + sgst + igst;
//       const total_amount = creditBase + total_tax;

//       await InvoiceItem.create({
//         invoice_id: invoice.id,
//         product_id: item.product_id,
//         product_name: product.product_name + ' (Credit Note)',
//         quantity: -returnQty,
//         unit_price: rentPerMonth,
//         total_price: -creditBase,
//         cgst: -cgst,
//         sgst: -sgst,
//         igst: -igst,
//         total_tax: -total_tax,
//         total_amount: -total_amount
//       });

//       invoiceAmount -= creditBase;
//       totalCGST -= cgst;
//       totalSGST -= sgst;
//       totalIGST -= igst;
//       totalTax -= total_tax;
//       grandTotal -= total_amount;
//     }
//   }
// }


//     // Save shipping details
//     if (shippingDetails) {
//       await InvoiceShippingDetail.create({
//         invoice_id: invoice.id,
//         consignee_name: shippingDetails.consignee_name,
//         country: shippingDetails.country,
//         state: shippingDetails.state,
//         city: shippingDetails.city,
//         street: shippingDetails.street,
//         landmark: shippingDetails.landmark,
//         pincode: shippingDetails.pincode,
//         phone_number: shippingDetails.phone_number,
//         email: shippingDetails.email
//       });
//     }

//     // Final response
//     res.status(201).json({
//       message: 'Invoice created successfully',
//       invoice_id: invoice.id,
//       amount: invoiceAmount,
//       tax: totalTax,
//       total_amount: grandTotal
//     });

//   } catch (error) {
//     console.error('Invoice creation error:', error);
//     res.status(500).json({
//       message: 'Error creating invoice',
//       error: error.message
//     });
//   }
// };