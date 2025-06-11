import db from '../models/index.js';
const Invoice = db.Invoice;
const InvoiceItem = db.InvoiceItem;
const InvoiceShippingDetail = db.InvoiceShippingDetail;

// Create a new invoice
export const createInvoice = async (req, res) => {
    try {
        const {
            invoice_number,
            invoice_title,
            customer_id,
            customer_name,
            invoice_date,
            duration,
            invoice_due_date,
            purchase_order_date,
            purchase_order_number,
            customer_gst_number,
            email,
            phone_number,
            pan_number,
            payment_terms,
            payment_mode,
            approval_status,
            approval_date,
            amount,
            cgst,
            sgst,
            igst,
            total_tax,
            total_amount,
            invoice_consulting_by,
            industry,
            remarks,
            items, // array of invoice items
            shippingDetails // shipping detail object
        } = req.body;

        const invoice = await Invoice.create({
            invoice_number,
            invoice_title,
            customer_id,
            customer_name,
            invoice_date,
            duration,
            invoice_due_date,
            purchase_order_date,
            purchase_order_number,
            customer_gst_number,
            email,
            phone_number,
            pan_number,
            payment_terms,
            payment_mode,
            approval_status,
            approval_date,
            amount,
            cgst,
            sgst,
            igst,
            total_tax,
            total_amount,
            invoice_consulting_by,
            industry,
            remarks
        });

        // Add invoice items if provided
        if (items && items.length) {
            await Promise.all(
                items.map(item => {
                    return InvoiceItem.create({
                        invoice_id: invoice.id,
                        product_id: item.product_id,
                        product_name: item.product_name,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        total_price: item.total_price,
                    });
                })
            );
        }

        // Add shipping details if provided
        if (shippingDetails) {
            await InvoiceShippingDetail.create({
                invoice_id: invoice.id,
                consignee_name: shippingDetails.consignee_name,
                country: shippingDetails.country,
                state: shippingDetails.state,
                city: shippingDetails.city,
                street: shippingDetails.street,
                landmark: shippingDetails.landmark,
                pincode: shippingDetails.pincode,
                phone_number: shippingDetails.phone_number,
                email: shippingDetails.email
            });
        }

        res.status(201).json({
            message: "Invoice created successfully",
            invoice_id: invoice.id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error creating invoice",
            error
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

// Get invoice by ID (including items & shipping details)
export const getInvoiceById = async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const invoice = await Invoice.findByPk(id, {
            include: [{
                    model: InvoiceItem,
                    as: 'items'
                },
                {
                    model: InvoiceShippingDetail,
                    as: 'shippingDetail'
                }
            ]
        });

        if (!invoice) return res.status(404).json({
            message: "Invoice not found"
        });

        res.status(200).json(invoice);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error fetching invoice",
            error
        });
    }
};

// Update invoice
export const updateInvoice = async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const invoice = await Invoice.findByPk(id);
        if (!invoice) return res.status(404).json({
            message: "Invoice not found"
        });

        await invoice.update({
            ...req.body,
            updated_at: new Date()
        });

        res.status(200).json({
            message: "Invoice updated successfully",
            invoice
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error updating invoice",
            error
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