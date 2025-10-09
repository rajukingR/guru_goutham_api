import db from '../models/index.js';
import {
  Op
} from 'sequelize';
import dayjs from 'dayjs';

const Invoice = db.Invoice;
const InvoiceItem = db.InvoiceItem;
const InvoiceShippingDetail = db.InvoiceShippingDetail;
const ProductTemplete = db.ProductTemplete;
const TaxType = db.TaxType;

const Order = db.Order;
const OrderItem = db.OrderItem;
const AssetId = db.AssetId;
const AssetModification = db.AssetModification;
const CreditNote = db.CreditNote;
const CreditNoteItem = db.CreditNoteItem;

const DeliveryChallan = db.DeliveryChallan;
const DeliveryChallanItem = db.DeliveryChallanItem;
const Peripheral = db.Peripheral;
const PeripheralItem = db.PeripheralItem;
const AssetSwap = db.AssetSwap;
const AssetTransaction = db.AssetTransaction;


export const createInvoice = async (req, res) => {
  try {
    if (!req.body.items || !req.body.items.length) {
      return res.status(400).json({
        error: "At least one invoice item is required"
      });
    }

    const {
      order_id,
      invoice_number,
      invoice_title,
      dispatch_order_number,
      dispatch_order_id,
      invoice_start_date,
      invoice_end_date,
      previous_delivered_start_date,
      previous_delivered_end_date,
      credit_note_start_date,
      credit_note_end_date,
      transaction_type,
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

    const normalizeInt = (val) => val === '' ? null : val;
    const getCurrentTimestamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
    const formatDate = (input) => {
      if (!input) return null;
      const date = new Date(input);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    };

    // Fetch DeliveryChallan using dispatch_order_id
    let dc_date = null;
    let dc_id = null;
    if (dispatch_order_id) {
      const deliveryChallan = await DeliveryChallan.findOne({
        where: {
          dispatch_order_id
        }
      });
      if (deliveryChallan) {
        dc_date = formatDate(deliveryChallan.dc_date);
        dc_id = deliveryChallan.id;
      }
    }

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

    if (!formattedInvoiceStartDate || !formattedInvoiceEndDate) {
      return res.status(400).json({
        error: "Invalid invoice date range provided"
      });
    }

    // Tax
    const tax = await TaxType.findOne({
      where: {
        tax_type_name: {
          [Op.like]: '%GST%'
        }
      }
    });
    const taxRate = tax ? tax.percentage : 18;
    const cgstRate = taxRate / 2;
    const sgstRate = taxRate / 2;

    // Create Invoice
    const invoice = await Invoice.create({
      order_id: normalizeInt(order_id),
      invoice_number,
      invoice_title,
      transaction_type,
      dc_id,
      dc_date,
      dispatch_order_number,
      dispatch_order_id,
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
      customer_id: normalizeInt(customer_id),
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
      created_at: getCurrentTimestamp()
    });

    // Process Invoice Items
    let invoiceAmount = 0;
    let totalCGST = 0;
    let totalSGST = 0;

    for (const item of items) {
      const product = await ProductTemplete.findByPk(item.product_id);
      if (!product) continue;

      const unitPrice = parseFloat(item.unit_price || 0);
      const totalPrice = parseFloat(item.total_price || 0);
      const cgst = parseFloat((totalPrice * (parseFloat(product.cgst || 0) / 100)));
      const sgst = parseFloat((totalPrice * (parseFloat(product.sgst || 0) / 100)));
      const totalTax = cgst + sgst;
      const totalAmount = totalPrice + totalTax;

      invoiceAmount += totalPrice;
      totalCGST += cgst;
      totalSGST += sgst;

      await InvoiceItem.create({
        invoice_id: invoice.id,
        order_id,
        product_id: item.product_id,
        product_name: item.product_name || product.product_name,
        previous_quantity: parseInt(item.previous_quantity || 0),
        quantity: parseInt(item.quantity || 0),
        unit_price: unitPrice.toFixed(2),
        total_price: totalPrice.toFixed(2),
        cgst: cgst.toFixed(2),
        sgst: sgst.toFixed(2),
        igst: "0.00",
        total_tax: totalTax.toFixed(2),
        total_amount: totalAmount.toFixed(2),
        rental_duration_months: parseInt(item.rental_duration_months || 0),
        rental_duration_days: parseInt(item.rental_duration_days || 0),
        new_quantity: parseInt(item.new_quantity || 0),
        return_quantity: parseInt(item.return_quantity || 0),
        device_ids: JSON.stringify(item.device_ids || []),
        new_device_ids: JSON.stringify(item.new_device_ids || []),
        returned_device_ids: JSON.stringify(item.returned_device_ids || []),
        added_date: item.added_date || null,
        returned_date: item.returned_date || null
      });

      // Update or Create Assets
      for (const deviceId of item.device_ids || []) {
        const existingAsset = await AssetId.findOne({
          where: {
            asset_id: deviceId
          }
        });
        if (existingAsset) {
          await existingAsset.update({
            invoice_id: invoice.id,
            product_id: product.id,
            product_name: product.product_name,
            updated_at: new Date()
          });
        } else {
          await AssetId.create({
            invoice_id: invoice.id,
            product_id: product.id,
            asset_id: deviceId,
            product_name: product.product_name,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    }

    // Update Invoice totals
    const grandTotal = invoiceAmount + totalCGST + totalSGST;
    await invoice.update({
      amount: parseFloat(invoiceAmount.toFixed(2)),
      cgst: parseFloat(totalCGST.toFixed(2)),
      sgst: parseFloat(totalSGST.toFixed(2)),
      igst: 0,
      total_tax: parseFloat((totalCGST + totalSGST).toFixed(2)),
      total_amount: parseFloat(grandTotal.toFixed(2))
    });

    // Shipping Details
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
        email: shippingDetails.email || email
      });
    }

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      total_amount: grandTotal.toFixed(2),
      asset_count: items.reduce((sum, item) => sum + (item.device_ids?.length || 0), 0)
    });

  } catch (error) {
    console.error("Error creating invoice:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create invoice",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};




// export const getAllInvoices = async (req, res) => {
//   try {
//     const allInvoices = await Invoice.findAll({
//       order: [
//         ['created_at', 'DESC']
//       ],
//       include: [{
//           model: InvoiceItem,
//           as: 'items'
//         },
//         {
//           model: InvoiceShippingDetail,
//           as: 'shippingDetail'
//         }
//       ]
//     });

//     const latestInvoicesMap = new Map();

//     for (const invoice of allInvoices) {
//       const customerId = invoice.customer_id;
//       if (!latestInvoicesMap.has(customerId)) {
//         latestInvoicesMap.set(customerId, invoice);
//       }
//     }

//     const latestInvoices = Array.from(latestInvoicesMap.values());

//     res.status(200).json(latestInvoices);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Error fetching invoices",
//       error
//     });
//   }
// };




// // // Get all invoices


export const getAllInvoices = async (req, res) => {
  try {
    // Fetch all invoices with related items, sorted by created_at DESC
    const invoices = await Invoice.findAll({
      include: [{
        model: InvoiceItem,
        as: "items",
        attributes: ["id", "product_id", "returned_date"],
      }, ],
      order: [
        ["id", "DESC"]
      ], // 👈 sort by id descending
    });


    // Step 2: Extract dispatch_order_ids for credit note lookup
    const dispatchOrderIds = invoices
      .map(inv => inv.dispatch_order_id)
      .filter(Boolean);

    // Step 3: Fetch credit notes with returned_date for those dispatch orders
    const creditNotes = await db.CreditNote.findAll({
      where: {
        dispatch_order_id: {
          [Op.in]: dispatchOrderIds,
        },
        returned_date: {
          [Op.not]: null,
        },
      },
      attributes: ["dispatch_order_id", "returned_date"],
    });

    // Step 4: Group returned dates by dispatch_order_id
    const groupedReturns = {};
    creditNotes.forEach(note => {
      const id = note.dispatch_order_id;
      if (!groupedReturns[id]) groupedReturns[id] = [];
      groupedReturns[id].push(note.returned_date);
    });

    // Step 5: Attach returned_date to corresponding invoice
    const finalResult = invoices.map(inv => {
      const returnedDates = groupedReturns[inv.dispatch_order_id] || [];
      return {
        ...inv.toJSON(),
        credit_note_returned_dates: returnedDates.length > 0 ? returnedDates[0] : null,
        // Use `.at(-1)` if you want latest return date instead of first one
      };
    });

    res.status(200).json(finalResult);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({
      message: "Error fetching invoices",
      error,
    });
  }
};






export const getAllApprovedInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      where: {
        approval_status: 'Approved',
        transaction_type: {
          [Op.ne]: 'Buy',
        },
        payment_mode: {
          [Op.ne]: 'Postpaid',
        },
      },
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
      order: [
        ['id', 'DESC']
      ],
    });

    // Process items to subtract returned quantity & devices
    const updatedInvoices = invoices.map(invoice => {
      const updatedItems = invoice.items.map(item => {
        const quantity = item.quantity || 0;
        const returnQty = item.return_quantity || 0;
        const netQty = quantity - returnQty;

        // Parse device_ids (stringified array)
        let originalDevices = [];
        try {
          originalDevices = JSON.parse(item.device_ids || '[]');
        } catch (err) {
          originalDevices = [];
        }

        const returnedDevices = Array.isArray(item.returned_device_ids) ?
          item.returned_device_ids : [];

        // Filter out returned devices
        const remainingDevices = originalDevices.filter(
          dev => !returnedDevices.includes(dev)
        );

        return {
          ...item.toJSON(),
          net_quantity: netQty,
          remaining_device_ids: remainingDevices,
        };
      });

      return {
        ...invoice.toJSON(),
        items: updatedItems,
      };
    });

    res.status(200).json(updatedInvoices);
  } catch (error) {
    console.error('Error fetching approved invoices:', error);
    res.status(500).json({
      message: 'Error fetching approved invoices',
      error,
    });
  }
};







export const getInvoicesByCustomerId = async (req, res) => {
  try {
    const {
      customerId
    } = req.params;

    const customerInvoices = await Invoice.findAll({
      where: {
        customer_id: customerId
      },
      order: [
        ['created_at', 'DESC']
      ], // Latest first
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

    if (!customerInvoices || customerInvoices.length === 0) {
      return res.status(404).json({
        message: 'No invoices found for this customer.'
      });
    }

    res.status(200).json(customerInvoices);
  } catch (error) {
    console.error('Error fetching invoices by customer ID:', error);
    res.status(500).json({
      message: "Error fetching invoices by customer ID",
      error
    });
  }
};

// export const getInvoicesByInvoiceId = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { type = 'current' } = req.query;

//     const invoice = await Invoice.findByPk(id);
//     if (!invoice) {
//       return res.status(404).json({ message: 'Invoice not found' });
//     }

//     const customerId = invoice.customer_id;
//     const invoiceEnd = dayjs(invoice.invoice_end_date);

//     const currentMonthStart = invoiceEnd.startOf('month').toDate();  // June 1
//     const currentMonthEnd = invoiceEnd.endOf('month').toDate();      // June 30
//     const previousMonthEnd = dayjs(currentMonthStart).subtract(1, 'day').endOf('day').toDate(); // May 31
//     const nextMonthEnd = dayjs(currentMonthEnd).add(1, 'month').endOf('month').toDate();        // July 31

//     let whereCondition = { customer_id: customerId };

//     if (type === 'previous') {
//       // All invoices up to previous month (May)
//       whereCondition.invoice_end_date = {
//         [Op.lte]: previousMonthEnd
//       };
//     } else if (type === 'current') {
//       // All invoices up to current month (June)
//       whereCondition.invoice_end_date = {
//         [Op.lte]: currentMonthEnd
//       };
//     } else if (type === 'next') {
//       // All invoices up to next month (July)
//       whereCondition.invoice_end_date = {
//         [Op.lte]: nextMonthEnd
//       };
//     } else {
//       return res.status(400).json({ message: 'Invalid type. Use previous, current, or next.' });
//     }

//     const customerInvoices = await Invoice.findAll({
//       where: whereCondition,
//       order: [['invoice_start_date', 'ASC']],
//       include: [
//         {
//           model: InvoiceItem,
//           as: 'items',
//           attributes: ['product_name', 'quantity', 'unit_price', 'device_ids']
//         },
//         {
//           model: InvoiceShippingDetail,
//           as: 'shippingDetail',
//           attributes: ['consignee_name', 'country', 'state', 'city', 'street', 'landmark', 'pincode', 'phone_number', 'email']
//         }
//       ],
//       attributes: [
//         'invoice_number',
//         'invoice_start_date',
//         'invoice_end_date',
//         'purchase_order_number',
//         'customer_gst_number',
//         'pan_number',
//         'phone_number',
//         'email'
//       ]
//     });

//     const formattedInvoices = customerInvoices.map(inv => {
//       const start = dayjs(inv.invoice_start_date);
//       const end = dayjs(inv.invoice_end_date);
//       return {
//         invoice_number: inv.invoice_number,
//         invoice_start_date: inv.invoice_start_date,
//         invoice_end_date: inv.invoice_end_date,
//         invoice_period: `${start.format('DD/MM/YYYY')} to ${end.format('DD/MM/YYYY')}`,
//         days: end.diff(start, 'day') + 1,
//         bill_to: {
//           name: inv.shippingDetail?.consignee_name,
//           address: `${inv.shippingDetail?.street}, ${inv.shippingDetail?.landmark}, ${inv.shippingDetail?.city}, ${inv.shippingDetail?.state}`,
//           pincode: inv.shippingDetail?.pincode,
//           country: inv.shippingDetail?.country
//         },
//         customer_details: {
//           customer_gst: inv.customer_gst_number,
//           pan_number: inv.pan_number,
//           po_number: inv.purchase_order_number,
//           email: inv.email,
//           phone: inv.phone_number
//         },
//         product_details: inv.items.map(item => ({
//           product_name: item.product_name,
//           quantity: item.quantity,
//           unit_price: item.unit_price,
//           device_ids: typeof item.device_ids === 'string'
//             ? JSON.parse(item.device_ids)
//             : (item.device_ids || [])
//         }))
//       };
//     });

//     res.status(200).json(formattedInvoices);

//   } catch (error) {
//     console.error('Error fetching invoices by invoice ID:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };






export const getInvoicesByInvoiceId = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const {
      type = 'current'
    } = req.query;

    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({
        message: 'Invoice not found'
      });
    }

    const customerId = invoice.customer_id;
    const currentId = invoice.id;
    const invoiceEnd = dayjs(invoice.invoice_end_date);

    const currentMonthStart = invoiceEnd.startOf('month').toDate(); // June 1
    const currentMonthEnd = invoiceEnd.endOf('month').toDate(); // June 30
    const previousMonthEnd = dayjs(currentMonthStart).subtract(1, 'day').endOf('day').toDate(); // May 31
    const nextMonthEnd = dayjs(currentMonthEnd).add(1, 'month').endOf('month').toDate(); // July 31

    // Base condition
    let whereCondition = {
      customer_id: customerId,
      id: {
        [Op.lte]: currentId
      } // Only invoices with ID <= current ID
    };

    // Date filter based on type
    if (type === 'previous') {
      // Filter using previous_delivered_end_date instead of invoice_end_date
      whereCondition.previous_delivered_end_date = {
        [Op.lte]: previousMonthEnd
      };
    } else if (type === 'current') {
      whereCondition.invoice_end_date = {
        [Op.lte]: currentMonthEnd
      };
    } else if (type === 'next') {
      whereCondition.invoice_end_date = {
        [Op.lte]: nextMonthEnd
      };
    } else {
      return res.status(400).json({
        message: 'Invalid type. Use previous, current, or next.'
      });
    }

    const customerInvoices = await Invoice.findAll({
      where: whereCondition,
      order: [
        ['invoice_start_date', 'ASC']
      ],
      include: [{
          model: InvoiceItem,
          as: 'items',
          attributes: ['product_name', 'quantity', 'unit_price', 'device_ids', 'return_quantity', 'returned_date', 'returned_device_ids']
        },
        {
          model: InvoiceShippingDetail,
          as: 'shippingDetail',
          attributes: ['consignee_name', 'country', 'state', 'city', 'street', 'landmark', 'pincode', 'phone_number', 'email']
        }
      ],
      attributes: [
        'invoice_number',
        'invoice_start_date',
        'rental_start_date',

        'purchase_order_number',
        'customer_gst_number',
        'pan_number',
        'phone_number',
        'email'
      ]
    });

    const formattedInvoices = customerInvoices.map(inv => {
      const start = dayjs(inv.invoice_start_date);
      const end = dayjs(inv.invoice_end_date);

      const startDay = start.date();
      const billedDays = 30 - startDay + 1;

      return {
        invoice_number: inv.invoice_number,
        invoice_start_date: inv.invoice_start_date,
        invoice_end_date: inv.invoice_end_date,
        invoice_period: `${start.format('DD/MM/YYYY')} to ${end.format('DD/MM/YYYY')}`,
        bill_to: {
          name: inv.shippingDetail?.consignee_name,
          address: `${inv.shippingDetail?.street}, ${inv.shippingDetail?.landmark}, ${inv.shippingDetail?.city}, ${inv.shippingDetail?.state}`,
          pincode: inv.shippingDetail?.pincode,
          country: inv.shippingDetail?.country
        },
        customer_details: {
          customer_gst: inv.customer_gst_number,
          pan_number: inv.pan_number,
          po_number: inv.purchase_order_number,
          email: inv.email,
          phone: inv.phone_number
        },
        product_details: inv.items.map(item => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          device_ids: typeof item.device_ids === 'string' ?
            JSON.parse(item.device_ids) : (item.device_ids || []),
          return_quantity: item.return_quantity,
          returned_date: item.returned_date,
          returned_device_ids: typeof item.returned_device_ids === 'string' ?
            JSON.parse(item.returned_device_ids) : (item.returned_device_ids || [])
        }))
      };
    });


    res.status(200).json(formattedInvoices);

  } catch (error) {
    console.error('Error fetching invoices by invoice ID:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};





///11-00-25





// export const getInvoiceById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Helper function to calculate month difference (date2 - date1)
//     const monthDiff = (date1, date2) => {
//       return (date2.getFullYear() - date1.getFullYear()) * 12 + 
//              (date2.getMonth() - date1.getMonth());
//     };

//     // Helper function to safely parse JSON arrays and prevent circular references
//     const parseJSONSafe = (input) => {
//       try {
//         if (typeof input === 'string') return JSON.parse(input);
//         if (Array.isArray(input)) return [...input];
//         return [];
//       } catch {
//         return [];
//       }
//     };

//     // Helper to safely convert model instances to plain objects
//     const toPlainObject = (modelInstance) => {
//       if (!modelInstance) return null;
//       const plainObject = modelInstance.get ? modelInstance.get({ plain: true }) : modelInstance;
//       return JSON.parse(JSON.stringify(plainObject)); // Break circular references
//     };

//     // 1. Fetch the invoice with related data
//     const invoice = await Invoice.findByPk(id, {
//       include: [
//         {
//           model: InvoiceItem,
//           as: 'items',
//           include: [{ 
//             model: ProductTemplete, 
//             as: 'productDetails',
//             attributes: { exclude: ['parent'] } // Avoid circular reference
//           }]
//         },
//         { 
//           model: InvoiceShippingDetail, 
//           as: 'shippingDetail' 
//         }
//       ]
//     });

//     if (!invoice) {
//       return res.status(404).json({ message: 'Invoice not found' });
//     }

//     // Convert invoice to plain object early to prevent circular references
//     const invoicePlain = toPlainObject(invoice);

//     // 2. Fetch related order information
//     const order = await Order.findByPk(invoicePlain.order_id);
//     const order_date = order?.order_date || null;
//     const order_table_id = order?.order_id || null;

//     let filteredCreditNotes = [];
//     let additionalDeliveryChallans = [];

//     // Only process credit notes and additional challans if not a Buy transaction
//     if (invoicePlain.transaction_type !== 'Buy') {
//       // 3. Get all credit notes for this invoice
//       const allCreditNotes = await CreditNote.findAll({
//         where: { dispatch_order_id: invoicePlain.dispatch_order_id },
//         include: [{ 
//           model: CreditNoteItem, 
//           as: 'items',
//           attributes: { exclude: ['parent'] } // Avoid circular reference
//         }]
//       });

//       // Process credit notes based on payment mode
//       const [displayCreditNotes, processOnlyCreditNotes] = allCreditNotes.reduce(
//         ([display, process], note) => {
//           const noteData = toPlainObject(note);
//           if (!noteData.returned_date) return [display, process];

//           const returnedDate = new Date(noteData.returned_date);
//           const invoiceStartDate = new Date(invoicePlain.invoice_start_date);
//           const dcDate = new Date(invoicePlain.dc_date);

//           const diffDC = monthDiff(dcDate, returnedDate);
//           const diffInvoice = monthDiff(invoiceStartDate, returnedDate);

//           // SPECIFIC CONDITIONS FOR PREPAID CREDIT NOTES
//           if (invoicePlain.payment_mode === 'Prepaid') {
//             // Display only if BOTH conditions are met:
//             // 1. Returned date is in same month as DC date (diffDC === 0)
//             // 2. Returned date is exactly 1 month BEFORE invoice start date (diffInvoice === -1)
//             if (diffDC === 0 && diffInvoice === -1) {
//               return [[...display, noteData], process];
//             }
//             // Special case: Process but don't display credit notes with returned dates:
//             // - After DC date
//             // - Before invoice start date
//             // - Not meeting the display conditions above
//             if (returnedDate > dcDate && returnedDate < invoiceStartDate) {
//               return [display, [...process, noteData]];
//             }
//             return [display, process];
//           } 
//           // Postpaid logic - show credit notes from same month as invoice start
//           else if (invoicePlain.payment_mode === 'Postpaid') {
//             if (diffInvoice === 0) {
//               return [[...display, noteData], process];
//             }
//             return [display, process];
//           }
//           return [display, process];
//         },
//         [[], []]
//       );

//       filteredCreditNotes = displayCreditNotes;

//       // 4. Update invoice items by subtracting returned devices
//       invoicePlain.items = invoicePlain.items.map((item) => {
//         const device_ids = parseJSONSafe(item.device_ids);
//         const returned_device_ids = parseJSONSafe(item.returned_device_ids);
//         const returnedFromCreditNotes = [];

//         // Combine displayed and process-only notes for device calculation
//         [...displayCreditNotes, ...processOnlyCreditNotes].forEach((note) => {
//           note.items.forEach((ri) => {
//             if (ri.product_id === item.product_id) {
//               returnedFromCreditNotes.push(...parseJSONSafe(ri.device_ids));
//             }
//           });
//         });

//         const remaining_device_ids = device_ids.filter(
//           (id) => !returned_device_ids.includes(id) && 
//                  !returnedFromCreditNotes.includes(id)
//         );

//         return {
//           ...item,
//           device_ids,
//           returned_device_ids,
//           remaining_device_ids: remaining_device_ids.length ? remaining_device_ids : device_ids
//         };
//       });

//       // 5. Get additional delivery challans for the customer
//       const invoiceDcDate = new Date(invoicePlain.dc_date);
//       const otherChallans = await DeliveryChallan.findAll({
//         where: {
//           [Op.and]: [
//             { customer_code: invoicePlain.customer_id.toString() },
//             { dispatch_order_id: { [Op.ne]: invoicePlain.dispatch_order_id } },
//             { dc_date: { [Op.lt]: invoiceDcDate } }
//           ]
//         },
//         include: [{
//           model: DeliveryChallanItem,
//           as: 'items',
//           include: [{ 
//             model: ProductTemplete, 
//             as: 'product',
//             attributes: { exclude: ['parent'] } // Avoid circular reference
//           }]
//         }]
//       });

//       // 6. Process additional challans with the same display conditions
//       for (const challan of otherChallans) {
//         const challanPlain = toPlainObject(challan);
//         const challanCreditNotes = await CreditNote.findAll({
//           where: { dispatch_order_id: challanPlain.dispatch_order_id },
//           include: [{ 
//             model: CreditNoteItem, 
//             as: 'items',
//             attributes: { exclude: ['parent'] }
//           }]
//         });

//         const [displayChallanNotes, processChallanNotes] = challanCreditNotes.reduce(
//           ([display, process], note) => {
//             const noteData = toPlainObject(note);
//             if (!noteData.returned_date) return [display, process];

//             const returnedDate = new Date(noteData.returned_date);
//             const invoiceStartDate = new Date(invoicePlain.invoice_start_date);
//             const dcDate = new Date(challanPlain.dc_date);

//             const diffDC = monthDiff(dcDate, returnedDate);
//             const diffInvoice = monthDiff(invoiceStartDate, returnedDate);

//             // Apply the same Prepaid conditions to additional challans
//             if (invoicePlain.payment_mode === 'Prepaid') {
//               if (diffDC === 0 && diffInvoice === -1) {
//                 return [[...display, noteData], process];
//               }
//               // Special case: Process but don't display
//               if (returnedDate > dcDate && returnedDate < invoiceStartDate) {
//                 return [display, [...process, noteData]];
//               }
//             } else if (invoicePlain.payment_mode === 'Postpaid') {
//               if (diffInvoice === 0) {
//                 return [[...display, noteData], process];
//               }
//             }
//             return [display, process];
//           },
//           [[], []]
//         );

//         challanPlain.credit_notes = displayChallanNotes;

//         // Update items with returned devices (including processed-but-not-displayed notes)
//         challanPlain.items = challanPlain.items.map((item) => {
//           const originalDeviceIds = parseJSONSafe(item.device_ids);
//           let updatedDeviceIds = [...originalDeviceIds];

//           [...displayChallanNotes, ...processChallanNotes].forEach((note) => {
//             note.items.forEach((ri) => {
//               if (ri.product_id === item.product_id) {
//                 const returnedIds = parseJSONSafe(ri.device_ids);
//                 updatedDeviceIds = updatedDeviceIds.filter(id => !returnedIds.includes(id));
//               }
//             });
//           });

//           return {
//             ...item,
//             device_ids: updatedDeviceIds,
//             quantity: updatedDeviceIds.length
//           };
//         });

//         additionalDeliveryChallans.push(challanPlain);
//       }
//     }

//     // 7. For Buy transactions, ensure remaining_device_ids equals device_ids
//     if (invoicePlain.transaction_type === 'Buy') {
//       invoicePlain.items = invoicePlain.items.map((item) => ({
//         ...item,
//         device_ids: parseJSONSafe(item.device_ids),
//         returned_device_ids: parseJSONSafe(item.returned_device_ids),
//         remaining_device_ids: parseJSONSafe(item.device_ids) // For Buy, all devices are remaining
//       }));
//     }

//     // 8. Prepare final response
//     const response = {
//       ...invoicePlain,
//       order_table_id: order_table_id,
//       order_date: order_date,
//       credit_notes: filteredCreditNotes,
//       additional_delivery_challans: additionalDeliveryChallans,
//       rental_start_date: invoicePlain.rental_start_date,
//       rental_end_date: invoicePlain.rental_end_date
//     };

//     return res.status(200).json(response);
//   } catch (error) {
//     console.error('Error fetching invoice:', error);
//     res.status(500).json({
//       message: 'Internal server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };





///26-08-2025




// export const getInvoiceById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Helper: safe JSON parse
//     const parseJSONSafe = (input) => {
//       try {
//         if (typeof input === "string") return JSON.parse(input);
//         return Array.isArray(input) ? input : [];
//       } catch {
//         return [];
//       }
//     };

//     // 1. Fetch invoice
//     const invoice = await Invoice.findByPk(id, {
//       include: [
//         {
//           model: InvoiceItem,
//           as: "items",
//           include: [
//             {
//               model: ProductTemplete,
//               as: "productDetails",
//             },
//           ],
//         },
//         {
//           model: InvoiceShippingDetail,
//           as: "shippingDetail",
//         },
//       ],
//     });

//     if (!invoice) {
//       return res.status(404).json({ message: "Invoice not found" });
//     }

//     // 2. Related order info
//     const order = await Order.findByPk(invoice.order_id);
//     const order_date = order?.order_date || null;
//     const order_table_id = order?.order_id || null;

//     // 3. Important dates
//     const invoiceStart = new Date(invoice.invoice_start_date);
//     const invoiceEnd = new Date(invoice.invoice_end_date);
//     const invoiceDcDate = new Date(invoice.dc_date);

//     let filteredCreditNotes = [];
//     let allReturnedFromCreditNotes = [];
//     let additionalDeliveryChallans = [];

//     // Only process credit notes and additional challans if not a Buy transaction
//     if (invoice.transaction_type !== "Buy") {
//       // 4. Credit notes for main challan
//       const creditNotes = await CreditNote.findAll({
//         where: { dispatch_order_id: invoice.dispatch_order_id },
//         include: [{ model: CreditNoteItem, as: "items" }],
//       });

//       filteredCreditNotes = creditNotes
//         .map((note) => note.toJSON())
//         .filter((note) => {
//           if (!note.returned_date || !note.dc_date) return false;

//           const returnedDate = new Date(note.returned_date);
//           const dcDate = new Date(note.dc_date);

//           let shouldIncludeInResponse = false;
//           let shouldSubtractDevices = false;

//           if (invoice.payment_mode === "Postpaid") {
//             shouldSubtractDevices =
//               returnedDate >= invoiceStart && returnedDate <= invoiceEnd;
//             shouldIncludeInResponse = shouldSubtractDevices;
//           } else if (invoice.payment_mode === "Prepaid") {
//             shouldSubtractDevices = returnedDate < invoiceStart;

//             const expectedReturnMonth = new Date(invoiceStart);
//             expectedReturnMonth.setMonth(expectedReturnMonth.getMonth() - 1);

//             const isExpectedMonth =
//               returnedDate.getMonth() === expectedReturnMonth.getMonth() &&
//               returnedDate.getFullYear() === expectedReturnMonth.getFullYear();

//             const sameMonth =
//               dcDate.getMonth() === returnedDate.getMonth() &&
//               dcDate.getFullYear() === returnedDate.getFullYear();

//             shouldIncludeInResponse = isExpectedMonth && sameMonth;
//           }

//           if (shouldSubtractDevices) {
//             note.items.forEach((ri) => {
//               allReturnedFromCreditNotes.push(...parseJSONSafe(ri.device_ids));
//             });
//           }

//           return shouldIncludeInResponse;
//         });

//       // 5. Additional challans - ONLY peripheral_update = false
//       const otherChallans = await DeliveryChallan.findAll({
//         where: {
//           [Op.and]: [
//             { customer_code: invoice.customer_id.toString() },
//             { dispatch_order_id: { [Op.ne]: invoice.dispatch_order_id } },
//             { dc_date: { [Op.lt]: invoiceDcDate } },
//             { peripheral_update: false },   // ✅ exclude true challans
//           ],
//         },
//         include: [
//           {
//             model: DeliveryChallanItem,
//             as: "items",
//             include: [{ model: ProductTemplete, as: "product" }],
//           },
//         ],
//         order: [["dc_date", "ASC"]],
//       });

//       for (const challan of otherChallans) {
//         const challanCreditNotes = await CreditNote.findAll({
//           where: { dispatch_order_id: challan.dispatch_order_id },
//           include: [{ model: CreditNoteItem, as: "items" }],
//         });

//         let allReturnedForChallan = [];

//         const challanFilteredCreditNotes = challanCreditNotes
//           .map((note) => note.toJSON())
//           .filter((note) => {
//             if (!note.returned_date || !note.dc_date) return false;

//             const returnedDate = new Date(note.returned_date);
//             const dcDate = new Date(note.dc_date);

//             let shouldIncludeInResponse = false;
//             let shouldSubtractDevices = false;

//             if (invoice.payment_mode === "Postpaid") {
//               const challanEndDate = new Date(challan.dc_date);
//               challanEndDate.setMonth(challanEndDate.getMonth() + 1);

//               shouldSubtractDevices =
//                 returnedDate >= new Date(challan.dc_date) &&
//                 returnedDate <= challanEndDate;
//               shouldIncludeInResponse = shouldSubtractDevices;
//             } else if (invoice.payment_mode === "Prepaid") {
//               shouldSubtractDevices = returnedDate < invoiceStart;

//               const expectedReturnMonth = new Date(challan.dc_date);
//               expectedReturnMonth.setMonth(expectedReturnMonth.getMonth() + 1);

//               const isExpectedMonth =
//                 returnedDate.getMonth() === expectedReturnMonth.getMonth() &&
//                 returnedDate.getFullYear() === expectedReturnMonth.getFullYear();

//               const sameMonth =
//                 dcDate.getMonth() === returnedDate.getMonth() &&
//                 dcDate.getFullYear() === returnedDate.getFullYear();

//               shouldIncludeInResponse = isExpectedMonth && sameMonth;
//             }

//             if (shouldSubtractDevices) {
//               note.items.forEach((ri) => {
//                 allReturnedForChallan.push(...parseJSONSafe(ri.device_ids));
//               });
//             }

//             return shouldIncludeInResponse;
//           });

//         const challanJSON = challan.toJSON();
//         challanJSON.credit_notes = challanFilteredCreditNotes;

//         challanJSON.items = challanJSON.items.map((item) => {
//           const originalDeviceIds = parseJSONSafe(item.device_ids);
//           const updatedDeviceIds = originalDeviceIds.filter(
//             (id) => !allReturnedForChallan.includes(id)
//           );

//           return {
//             ...item,
//             device_ids: updatedDeviceIds,
//             quantity: updatedDeviceIds.length,
//           };
//         });

//         additionalDeliveryChallans.push(challanJSON);
//       }
//     }

//     // 6. Adjust main invoice items
//     const updatedItems = invoice.items.map((item) => {
//       const device_ids = parseJSONSafe(item.device_ids);
//       const returned_device_ids = parseJSONSafe(item.returned_device_ids);

//       const remaining_device_ids =
//         invoice.transaction_type === "Buy"
//           ? device_ids
//           : device_ids.filter(
//               (id) =>
//                 !returned_device_ids.includes(id) &&
//                 !allReturnedFromCreditNotes.includes(id)
//             );

//       return {
//         ...item.toJSON(),
//         device_ids,
//         returned_device_ids,
//         remaining_device_ids,
//       };
//     });

//     // 7. Final API response
//     const invoiceJSON = invoice.toJSON();
//     invoiceJSON.items = updatedItems;
//     invoiceJSON.order_table_id = order_table_id;
//     invoiceJSON.order_date = order_date;
//     invoiceJSON.credit_notes = filteredCreditNotes;
//     invoiceJSON.additional_delivery_challans = additionalDeliveryChallans;
//     invoiceJSON.rental_start_date = invoice.rental_start_date;
//     invoiceJSON.rental_end_date = invoice.rental_end_date;

//     return res.status(200).json(invoiceJSON);
//   } catch (error) {
//     console.error("Error fetching invoice:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };



//UPDATED 39-08-2025

// export const getInvoiceById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Helper: safe JSON parse
//     const parseJSONSafe = (input) => {
//       try {
//         if (typeof input === "string") return JSON.parse(input);
//         return Array.isArray(input) ? input : [];
//       } catch {
//         return [];
//       }
//     };

//     // Helper: Get peripherals for devices
//     const getPeripheralsForDevices = async (productId, deviceIds, invoiceStartDate) => {
//       if (!deviceIds || deviceIds.length === 0) return [];

//       const peripherals = await Peripheral.findAll({
//         where: {
//           parent_product_id: productId,
//           parent_asset_id: { [Op.in]: deviceIds },
//           approved_date: { [Op.lt]: invoiceStartDate }
//         },
//         include: [{
//           model: PeripheralItem,
//           as: "items"
//         }]
//       });

//       return peripherals.map(p => p.toJSON());
//     };

//     // 1. Fetch invoice
//     const invoice = await Invoice.findByPk(id, {
//       include: [
//         {
//           model: InvoiceItem,
//           as: "items",
//           include: [
//             {
//               model: ProductTemplete,
//               as: "productDetails",
//             },
//           ],
//         },
//         {
//           model: InvoiceShippingDetail,
//           as: "shippingDetail",
//         },
//       ],
//     });

//     if (!invoice) {
//       return res.status(404).json({ message: "Invoice not found" });
//     }

//     // 2. Related order info
//     const order = await Order.findByPk(invoice.order_id);
//     const order_date = order?.order_date || null;
//     const order_table_id = order?.order_id || null;

//     // 3. Important dates
//     const invoiceStart = new Date(invoice.invoice_start_date);
//     const invoiceEnd = new Date(invoice.invoice_end_date);
//     const invoiceDcDate = new Date(invoice.dc_date);

//     let filteredCreditNotes = [];
//     let allReturnedFromCreditNotes = [];
//     let additionalDeliveryChallans = [];

//     // Only process credit notes and additional challans if not a Buy transaction
//     if (invoice.transaction_type !== "Buy") {
//       // 4. Credit notes for main challan
//       const creditNotes = await CreditNote.findAll({
//         where: { dispatch_order_id: invoice.dispatch_order_id },
//         include: [{ model: CreditNoteItem, as: "items" }],
//       });

//       filteredCreditNotes = creditNotes
//         .map((note) => note.toJSON())
//         .filter((note) => {
//           if (!note.returned_date || !note.dc_date) return false;

//           const returnedDate = new Date(note.returned_date);
//           const dcDate = new Date(note.dc_date);

//           let shouldIncludeInResponse = false;
//           let shouldSubtractDevices = false;

//           if (invoice.payment_mode === "Postpaid") {
//             shouldSubtractDevices =
//               returnedDate >= invoiceStart && returnedDate <= invoiceEnd;
//             shouldIncludeInResponse = shouldSubtractDevices;
//           } else if (invoice.payment_mode === "Prepaid") {
//             shouldSubtractDevices = returnedDate < invoiceStart;

//             const expectedReturnMonth = new Date(invoiceStart);
//             expectedReturnMonth.setMonth(expectedReturnMonth.getMonth() - 1);

//             const isExpectedMonth =
//               returnedDate.getMonth() === expectedReturnMonth.getMonth() &&
//               returnedDate.getFullYear() === expectedReturnMonth.getFullYear();

//             const sameMonth =
//               dcDate.getMonth() === returnedDate.getMonth() &&
//               dcDate.getFullYear() === returnedDate.getFullYear();

//             shouldIncludeInResponse = isExpectedMonth && sameMonth;
//           }

//           if (shouldSubtractDevices) {
//             note.items.forEach((ri) => {
//               allReturnedFromCreditNotes.push(...parseJSONSafe(ri.device_ids));
//             });
//           }

//           return shouldIncludeInResponse;
//         });

//       // 5. Additional challans - ONLY peripheral_update = false
//       const otherChallans = await DeliveryChallan.findAll({
//         where: {
//           [Op.and]: [
//             { customer_code: invoice.customer_id.toString() },
//             { dispatch_order_id: { [Op.ne]: invoice.dispatch_order_id } },
//             { dc_date: { [Op.lt]: invoiceDcDate } },
//             { peripheral_update: false },   // ✅ exclude true challans
//           ],
//         },
//         include: [
//           {
//             model: DeliveryChallanItem,
//             as: "items",
//             include: [{ model: ProductTemplete, as: "product" }],
//           },
//         ],
//         order: [["dc_date", "ASC"]],
//       });

//       for (const challan of otherChallans) {
//         const challanCreditNotes = await CreditNote.findAll({
//           where: { dispatch_order_id: challan.dispatch_order_id },
//           include: [{ model: CreditNoteItem, as: "items" }],
//         });

//         let allReturnedForChallan = [];

//         const challanFilteredCreditNotes = challanCreditNotes
//           .map((note) => note.toJSON())
//           .filter((note) => {
//             if (!note.returned_date || !note.dc_date) return false;

//             const returnedDate = new Date(note.returned_date);
//             const dcDate = new Date(note.dc_date);

//             let shouldIncludeInResponse = false;
//             let shouldSubtractDevices = false;

//             if (invoice.payment_mode === "Postpaid") {
//               const challanEndDate = new Date(challan.dc_date);
//               challanEndDate.setMonth(challanEndDate.getMonth() + 1);

//               shouldSubtractDevices =
//                 returnedDate >= new Date(challan.dc_date) &&
//                 returnedDate <= challanEndDate;
//               shouldIncludeInResponse = shouldSubtractDevices;
//             } else if (invoice.payment_mode === "Prepaid") {
//               shouldSubtractDevices = returnedDate < invoiceStart;

//               const expectedReturnMonth = new Date(challan.dc_date);
//               expectedReturnMonth.setMonth(expectedReturnMonth.getMonth() + 1);

//               const isExpectedMonth =
//                 returnedDate.getMonth() === expectedReturnMonth.getMonth() &&
//                 returnedDate.getFullYear() === expectedReturnMonth.getFullYear();

//               const sameMonth =
//                 dcDate.getMonth() === returnedDate.getMonth() &&
//                 dcDate.getFullYear() === returnedDate.getFullYear();

//               shouldIncludeInResponse = isExpectedMonth && sameMonth;
//             }

//             if (shouldSubtractDevices) {
//               note.items.forEach((ri) => {
//                 allReturnedForChallan.push(...parseJSONSafe(ri.device_ids));
//               });
//             }

//             return shouldIncludeInResponse;
//           });

//         const challanJSON = challan.toJSON();
//         challanJSON.credit_notes = challanFilteredCreditNotes;

//         challanJSON.items = challanJSON.items.map((item) => {
//           const originalDeviceIds = parseJSONSafe(item.device_ids);
//           const updatedDeviceIds = originalDeviceIds.filter(
//             (id) => !allReturnedForChallan.includes(id)
//           );

//           return {
//             ...item,
//             device_ids: updatedDeviceIds,
//             quantity: updatedDeviceIds.length,
//           };
//         });

//         additionalDeliveryChallans.push(challanJSON);
//       }
//     }

//     // 6. Adjust main invoice items and get peripherals
//     const updatedItems = [];
//     for (const item of invoice.items) {
//       const device_ids = parseJSONSafe(item.device_ids);
//       const returned_device_ids = parseJSONSafe(item.returned_device_ids);

//       const remaining_device_ids =
//         invoice.transaction_type === "Buy"
//           ? device_ids
//           : device_ids.filter(
//               (id) =>
//                 !returned_device_ids.includes(id) &&
//                 !allReturnedFromCreditNotes.includes(id)
//             );

//       // Get peripherals for devices delivered before invoice start month
//       const peripheralItems = await getPeripheralsForDevices(
//         item.product_id,
//         remaining_device_ids,
//         invoiceStart
//       );

//       updatedItems.push({
//         ...item.toJSON(),
//         device_ids,
//         returned_device_ids,
//         remaining_device_ids,
//         peripheralItems // Add peripherals to the item
//       });
//     }

//     // 7. Get peripherals for additional delivery challan items
//     for (const challan of additionalDeliveryChallans) {
//       for (const item of challan.items) {
//         const device_ids = parseJSONSafe(item.device_ids);

//         // Get peripherals for devices delivered before invoice start month
//         const peripheralItems = await getPeripheralsForDevices(
//           item.product_id,
//           device_ids,
//           invoiceStart
//         );

//         item.peripheralItems = peripheralItems;
//       }
//     }

//     // 8. Final API response
//     const invoiceJSON = invoice.toJSON();
//     invoiceJSON.items = updatedItems;
//     invoiceJSON.order_table_id = order_table_id;
//     invoiceJSON.order_date = order_date;
//     invoiceJSON.credit_notes = filteredCreditNotes;
//     invoiceJSON.additional_delivery_challans = additionalDeliveryChallans;
//     invoiceJSON.rental_start_date = invoice.rental_start_date;
//     invoiceJSON.rental_end_date = invoice.rental_end_date;

//     return res.status(200).json(invoiceJSON);
//   } catch (error) {
//     console.error("Error fetching invoice:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };




////02-09-2025




// export const getInvoiceById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Helper: safe JSON parse
//     const parseJSONSafe = (input) => {
//       try {
//         if (typeof input === "string") return JSON.parse(input);
//         return Array.isArray(input) ? input : [];
//       } catch {
//         return [];
//       }
//     };

//     // Helper: Get peripherals for devices
//     const getPeripheralsForDevices = async (productId, deviceIds, invoiceStartDate) => {
//       if (!deviceIds || deviceIds.length === 0) return [];

//       const peripherals = await Peripheral.findAll({
//         where: {
//           parent_product_id: productId,
//           parent_asset_id: { [Op.in]: deviceIds },
//           approved_date: { [Op.lt]: invoiceStartDate }
//         },
//         include: [{
//           model: PeripheralItem,
//           as: "items"
//         }]
//       });

//       return peripherals.map(p => p.toJSON());
//     };

//     // Helper: Check if challan should be included based on dates
// const shouldIncludeChallan = (challanOrderSaleDate, invoiceStartDate) => {
//   // If challan.order_sale_date is NULL → always include
//   if (!challanOrderSaleDate) return true;
//   if (!invoiceStartDate) return false;

//   const challanDate = new Date(challanOrderSaleDate);
//   const invoiceStart = new Date(invoiceStartDate);

//   // Reset both dates to the first day of their respective months for accurate comparison
//   const challanMonth = new Date(challanDate.getFullYear(), challanDate.getMonth(), 1);
//   const invoiceMonth = new Date(invoiceStart.getFullYear(), invoiceStart.getMonth(), 1);

//   // Same month
//   const sameMonth = challanMonth.getTime() === invoiceMonth.getTime();
//   // Only include challans same month or AFTER invoice month
//   const challanAfterInvoice = challanMonth >= invoiceMonth;

//   return sameMonth || challanAfterInvoice;
// };


//     // 1. Fetch invoice
//     const invoice = await Invoice.findByPk(id, {
//       include: [
//         {
//           model: InvoiceItem,
//           as: "items",
//           include: [
//             {
//               model: ProductTemplete,
//               as: "productDetails",
//             },
//           ],
//         },
//         {
//           model: InvoiceShippingDetail,
//           as: "shippingDetail",
//         },
//       ],
//     });

//     if (!invoice) {
//       return res.status(404).json({ message: "Invoice not found" });
//     }

//     // 2. Related order info
//     const order = await Order.findByPk(invoice.order_id);
//     const order_date = order?.order_date || null;
//     const order_table_id = order?.order_id || null;

//     // 3. Important dates
//     const invoiceStart = new Date(invoice.invoice_start_date);
//     const invoiceEnd = new Date(invoice.invoice_end_date);
//     const invoiceDcDate = new Date(invoice.dc_date);

//     let filteredCreditNotes = [];
//     let allReturnedFromCreditNotes = [];
//     let additionalDeliveryChallans = [];

//     // Only process credit notes and additional challans if not a Buy transaction
//     if (invoice.transaction_type !== "Buy") {
//       // 4. Credit notes for main challan
//       const creditNotes = await CreditNote.findAll({
//         where: { dispatch_order_id: invoice.dispatch_order_id },
//         include: [{ model: CreditNoteItem, as: "items" }],
//       });

//       filteredCreditNotes = creditNotes
//         .map((note) => note.toJSON())
//         .filter((note) => {
//           if (!note.returned_date || !note.dc_date) return false;

//           const returnedDate = new Date(note.returned_date);
//           const dcDate = new Date(note.dc_date);

//           let shouldIncludeInResponse = false;
//           let shouldSubtractDevices = false;

//           if (invoice.payment_mode === "Postpaid") {
//             shouldSubtractDevices =
//               returnedDate >= invoiceStart && returnedDate <= invoiceEnd;
//             shouldIncludeInResponse = shouldSubtractDevices;
//           } else if (invoice.payment_mode === "Prepaid") {
//             shouldSubtractDevices = returnedDate < invoiceStart;

//             const expectedReturnMonth = new Date(invoiceStart);
//             expectedReturnMonth.setMonth(expectedReturnMonth.getMonth() - 1);

//             const isExpectedMonth =
//               returnedDate.getMonth() === expectedReturnMonth.getMonth() &&
//               returnedDate.getFullYear() === expectedReturnMonth.getFullYear();

//             const sameMonth =
//               dcDate.getMonth() === returnedDate.getMonth() &&
//               dcDate.getFullYear() === returnedDate.getFullYear();

//             shouldIncludeInResponse = isExpectedMonth && sameMonth;
//           }

//           if (shouldSubtractDevices) {
//             note.items.forEach((ri) => {
//               allReturnedFromCreditNotes.push(...parseJSONSafe(ri.device_ids));
//             });
//           }

//           return shouldIncludeInResponse;
//         });

//       // 5. Additional challans - ONLY peripheral_update = false
//       const otherChallans = await DeliveryChallan.findAll({
//         where: {
//           [Op.and]: [
//             { customer_code: invoice.customer_id.toString() },
//             { dispatch_order_id: { [Op.ne]: invoice.dispatch_order_id } },
//             { dc_date: { [Op.lt]: invoiceDcDate } },
//             { peripheral_update: false },   // ✅ exclude true challans
//           ],
//         },
//         include: [
//           {
//             model: DeliveryChallanItem,
//             as: "items",
//             include: [{ model: ProductTemplete, as: "product" }],
//           },
//         ],
//         order: [["dc_date", "ASC"]],
//       });

//       for (const challan of otherChallans) {
//         // Check if challan should be included based on order_sale_date and invoice_start_date
//         if (!shouldIncludeChallan(challan.order_sale_date, invoice.invoice_start_date)) {
//           continue; // Skip this challan if it's from a future month
//         }

//         const challanCreditNotes = await CreditNote.findAll({
//           where: { dispatch_order_id: challan.dispatch_order_id },
//           include: [{ model: CreditNoteItem, as: "items" }],
//         });

//         let allReturnedForChallan = [];

//         const challanFilteredCreditNotes = challanCreditNotes
//           .map((note) => note.toJSON())
//           .filter((note) => {
//             if (!note.returned_date || !note.dc_date) return false;

//             const returnedDate = new Date(note.returned_date);
//             const dcDate = new Date(note.dc_date);

//             let shouldIncludeInResponse = false;
//             let shouldSubtractDevices = false;

//             if (invoice.payment_mode === "Postpaid") {
//               const challanEndDate = new Date(challan.dc_date);
//               challanEndDate.setMonth(challanEndDate.getMonth() + 1);

//               shouldSubtractDevices =
//                 returnedDate >= new Date(challan.dc_date) &&
//                 returnedDate <= challanEndDate;
//               shouldIncludeInResponse = shouldSubtractDevices;
//             } else if (invoice.payment_mode === "Prepaid") {
//               shouldSubtractDevices = returnedDate < invoiceStart;

//               const expectedReturnMonth = new Date(challan.dc_date);
//               expectedReturnMonth.setMonth(expectedReturnMonth.getMonth() + 1);

//               const isExpectedMonth =
//                 returnedDate.getMonth() === expectedReturnMonth.getMonth() &&
//                 returnedDate.getFullYear() === expectedReturnMonth.getFullYear();

//               const sameMonth =
//                 dcDate.getMonth() === returnedDate.getMonth() &&
//                 dcDate.getFullYear() === returnedDate.getFullYear();

//               shouldIncludeInResponse = isExpectedMonth && sameMonth;
//             }

//             if (shouldSubtractDevices) {
//               note.items.forEach((ri) => {
//                 allReturnedForChallan.push(...parseJSONSafe(ri.device_ids));
//               });
//             }

//             return shouldIncludeInResponse;
//           });

//         const challanJSON = challan.toJSON();
//         challanJSON.credit_notes = challanFilteredCreditNotes;

//         challanJSON.items = challanJSON.items.map((item) => {
//           const originalDeviceIds = parseJSONSafe(item.device_ids);
//           const updatedDeviceIds = originalDeviceIds.filter(
//             (id) => !allReturnedForChallan.includes(id)
//           );

//           return {
//             ...item,
//             device_ids: updatedDeviceIds,
//             quantity: updatedDeviceIds.length,
//           };
//         });

//         additionalDeliveryChallans.push(challanJSON);
//       }
//     }

//     // 6. Adjust main invoice items and get peripherals
//     const updatedItems = [];
//     for (const item of invoice.items) {
//       const device_ids = parseJSONSafe(item.device_ids);
//       const returned_device_ids = parseJSONSafe(item.returned_device_ids);

//       const remaining_device_ids =
//         invoice.transaction_type === "Buy"
//           ? device_ids
//           : device_ids.filter(
//               (id) =>
//                 !returned_device_ids.includes(id) &&
//                 !allReturnedFromCreditNotes.includes(id)
//             );

//       // Get peripherals for devices delivered before invoice start month
//       const peripheralItems = await getPeripheralsForDevices(
//         item.product_id,
//         remaining_device_ids,
//         invoiceStart
//       );

//       updatedItems.push({
//         ...item.toJSON(),
//         device_ids,
//         returned_device_ids,
//         remaining_device_ids,
//         peripheralItems // Add peripherals to the item
//       });
//     }

//     // 7. Get peripherals for additional delivery challan items
//     for (const challan of additionalDeliveryChallans) {
//       for (const item of challan.items) {
//         const device_ids = parseJSONSafe(item.device_ids);

//         // Get peripherals for devices delivered before invoice start month
//         const peripheralItems = await getPeripheralsForDevices(
//           item.product_id,
//           device_ids,
//           invoiceStart
//         );

//         item.peripheralItems = peripheralItems;
//       }
//     }

//     // 8. Final API response
//     const invoiceJSON = invoice.toJSON();
//     invoiceJSON.items = updatedItems;
//     invoiceJSON.order_table_id = order_table_id;
//     invoiceJSON.order_date = order_date;
//     invoiceJSON.credit_notes = filteredCreditNotes;
//     invoiceJSON.additional_delivery_challans = additionalDeliveryChallans;
//     invoiceJSON.rental_start_date = invoice.rental_start_date;
//     invoiceJSON.rental_end_date = invoice.rental_end_date;

//     return res.status(200).json(invoiceJSON);
//   } catch (error) {
//     console.error("Error fetching invoice:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };











// export const getInvoiceById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const invoice = await Invoice.findByPk(id, {
//       include: [
//         {
//           model: InvoiceItem,
//           as: "items",
//           include: [
//             {
//               model: ProductTemplete,
//               as: "productDetails",
//             },
//           ],
//         },
//         {
//           model: InvoiceShippingDetail,
//           as: "shippingDetail",
//         },
//       ],
//     });

//     if (!invoice) {
//       return res.status(404).json({ message: "Invoice not found" });
//     }

//     const order = await Order.findByPk(invoice.order_id);
//     const order_date = order?.order_date || null;
//     const order_table_id = order?.order_id || null;

//     const parseJSONSafe = (input) => {
//       try {
//         if (typeof input === "string") return JSON.parse(input);
//         return Array.isArray(input) ? input : [];
//       } catch {
//         return [];
//       }
//     };

//     // Get ALL credit notes for the invoice
//     const creditNotes = await CreditNote.findAll({
//       where: {
//         dispatch_order_id: invoice.dispatch_order_id,
//       },
//       include: [
//         {
//           model: CreditNoteItem,
//           as: "items",
//         },
//       ],
//     });

//     const invoiceStart = new Date(invoice.invoice_start_date);
//     const invoiceStartMonth = invoiceStart.getMonth();
//     const invoiceStartYear = invoiceStart.getFullYear();

//     // Process credit notes
//     const allCreditNotes = creditNotes.map((note) => note.toJSON());

//     // Separate credit notes into two groups
//     const sameMonthCreditNotes = [];
//     const differentMonthCreditNotes = [];

//     allCreditNotes.forEach((note) => {
//       if (!note.returned_date) return;

//       const returnedDate = new Date(note.returned_date);
//       const returnedMonth = returnedDate.getMonth();
//       const returnedYear = returnedDate.getFullYear();

//       if (returnedMonth === invoiceStartMonth && 
//           returnedYear === invoiceStartYear) {
//         sameMonthCreditNotes.push(note);
//       } else {
//         differentMonthCreditNotes.push(note);
//       }
//     });

//     // Update main invoice items - only subtract different month credit notes
//     const updatedItems = invoice.items.map((item) => {
//       const device_ids = parseJSONSafe(item.device_ids);
//       const returned_device_ids = parseJSONSafe(item.returned_device_ids);

//       // Only include returned devices from different month credit notes
//       const returnedDeviceIdsToSubtract = [];

//       differentMonthCreditNotes.forEach((note) => {
//         note.items.forEach((ri) => {
//           if (ri.product_id === item.product_id) {
//             returnedDeviceIdsToSubtract.push(...(ri.device_ids || []));
//           }
//         });
//       });

//       return {
//         ...item.toJSON(),
//         device_ids: device_ids.filter(
//           (id) => !returnedDeviceIdsToSubtract.includes(id)
//         ),
//         returned_device_ids,
//       };
//     });

//     // Fetch additional delivery challans
//     const invoiceDcDate = new Date(invoice.dc_date);

//     const otherChallans = await DeliveryChallan.findAll({
//       where: {
//         [Op.and]: [
//           {
//             customer_code: invoice.customer_id.toString(),
//           },
//           {
//             dispatch_order_id: {
//               [Op.ne]: invoice.dispatch_order_id,
//             },
//           },
//           {
//             dc_date: {
//               [Op.lt]: invoiceDcDate,
//             },
//           },
//         ],
//       },
//       include: [
//         {
//           model: DeliveryChallanItem,
//           as: "items",
//           include: [
//             {
//               model: ProductTemplete,
//               as: "product",
//             },
//           ],
//         },
//       ],
//     });

//     const additionalDeliveryChallans = [];

//     for (const challan of otherChallans) {
//       const challanDispatchOrderId = challan.dispatch_order_id;

//       // Get ALL credit notes for this challan
//       const challanCreditNotes = await CreditNote.findAll({
//         where: {
//           dispatch_order_id: challanDispatchOrderId,
//         },
//         include: [
//           {
//             model: CreditNoteItem,
//             as: "items",
//           },
//         ],
//       });

//       const allChallanCreditNotes = challanCreditNotes.map(note => note.toJSON());

//       // Separate challan credit notes
//       const challanSameMonthNotes = [];
//       const challanDifferentMonthNotes = [];

//       allChallanCreditNotes.forEach((note) => {
//         if (!note.returned_date) return;

//         const returnedDate = new Date(note.returned_date);
//         const returnedMonth = returnedDate.getMonth();
//         const returnedYear = returnedDate.getFullYear();

//         if (returnedMonth === invoiceStartMonth && 
//             returnedYear === invoiceStartYear) {
//           challanSameMonthNotes.push(note);
//         } else {
//           challanDifferentMonthNotes.push(note);
//         }
//       });

//       const challanJSON = challan.toJSON();

//       // Show same month credit notes
//       for (const note of challanSameMonthNotes) {
//         for (const item of note.items) {
//           const product = await ProductTemplete.findOne({
//             where: {
//               id: item.product_id,
//             },
//           });
//           item.productDetails = product?.toJSON() || null;
//         }
//       }

//       challanJSON.credit_notes = challanSameMonthNotes;

//       // Subtract different month credit notes from items
//       challanJSON.items = challanJSON.items.map((item) => {
//         let returnedDeviceIds = [];

//         challanDifferentMonthNotes.forEach((note) => {
//           note.items.forEach((ri) => {
//             if (ri.product_id === item.product_id) {
//               returnedDeviceIds.push(...(ri.device_ids || []));
//             }
//           });
//         });

//         const originalDeviceIds = item.device_ids || [];
//         const updatedDeviceIds = originalDeviceIds.filter(
//           (id) => !returnedDeviceIds.includes(id)
//         );

//         return {
//           ...item,
//           device_ids: updatedDeviceIds,
//           quantity: updatedDeviceIds.length,
//         };
//       });

//       additionalDeliveryChallans.push(challanJSON);
//     }

//     const invoiceJSON = invoice.toJSON();
//     invoiceJSON.items = updatedItems;
//     invoiceJSON.order_table_id = order_table_id;
//     invoiceJSON.order_date = order_date;
//     invoiceJSON.credit_notes = sameMonthCreditNotes; // Only show same month notes
//     invoiceJSON.additional_delivery_challans = additionalDeliveryChallans;
//     invoiceJSON.rental_start_date = invoice.rental_start_date;
//     invoiceJSON.rental_end_date = invoice.rental_end_date;

//     return res.status(200).json(invoiceJSON);
//   } catch (error) {
//     console.error("Error fetching invoice:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };


///05-09-25

// export const getInvoiceById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Helper: safe JSON parse
//     const parseJSONSafe = (input) => {
//       try {
//         if (typeof input === "string") return JSON.parse(input);
//         return Array.isArray(input) ? input : [];
//       } catch {
//         return [];
//       }
//     };

//     // Helper: Get peripherals for devices
//     const getPeripheralsForDevices = async (productId, deviceIds, invoiceStartDate) => {
//       if (!deviceIds || deviceIds.length === 0) return [];

//       const peripherals = await Peripheral.findAll({
//         where: {
//           parent_product_id: productId,
//           parent_asset_id: { [Op.in]: deviceIds },
//           approved_date: { [Op.lt]: invoiceStartDate }
//         },
//         include: [{
//           model: PeripheralItem,
//           as: "items"
//         }]
//       });

//       return peripherals.map(p => p.toJSON());
//     };

//     // Helper: Check if challan should be included based on dates
// const shouldIncludeChallan = (challanOrderSaleDate, invoiceStartDate) => {
//   // If challan.order_sale_date is NULL → always include
//   if (!challanOrderSaleDate) return true;
//   if (!invoiceStartDate) return false;

//   const challanDate = new Date(challanOrderSaleDate);
//   const invoiceStart = new Date(invoiceStartDate);

//   // Reset both dates to the first day of their respective months for accurate comparison
//   const challanMonth = new Date(challanDate.getFullYear(), challanDate.getMonth(), 1);
//   const invoiceMonth = new Date(invoiceStart.getFullYear(), invoiceStart.getMonth(), 1);

//   // Same month
//   const sameMonth = challanMonth.getTime() === invoiceMonth.getTime();
//   // Only include challans same month or AFTER invoice month
//   const challanAfterInvoice = challanMonth >= invoiceMonth;

//   return sameMonth || challanAfterInvoice;
// };


//     // 1. Fetch invoice
//     const invoice = await Invoice.findByPk(id, {
//       include: [
//         {
//           model: InvoiceItem,
//           as: "items",
//           include: [
//             {
//               model: ProductTemplete,
//               as: "productDetails",
//             },
//           ],
//         },
//         {
//           model: InvoiceShippingDetail,
//           as: "shippingDetail",
//         },
//       ],
//     });

//     if (!invoice) {
//       return res.status(404).json({ message: "Invoice not found" });
//     }

//     // 2. Related order info
//     const order = await Order.findByPk(invoice.order_id);
//     const order_date = order?.order_date || null;
//     const order_table_id = order?.order_id || null;

//     // 3. Important dates
//     const invoiceStart = new Date(invoice.invoice_start_date);
//     const invoiceEnd = new Date(invoice.invoice_end_date);
//     const invoiceDcDate = new Date(invoice.dc_date);

//     let filteredCreditNotes = [];
//     let allReturnedFromCreditNotes = [];
//     let additionalDeliveryChallans = [];

//     // Only process credit notes and additional challans if not a Buy transaction
//     if (invoice.transaction_type !== "Buy") {
//       // 4. Credit notes for main challan
//       const creditNotes = await CreditNote.findAll({
//         where: { dispatch_order_id: invoice.dispatch_order_id },
//         include: [{ model: CreditNoteItem, as: "items" }],
//       });

//       filteredCreditNotes = creditNotes
//         .map((note) => note.toJSON())
//         .filter((note) => {
//           if (!note.returned_date || !note.dc_date) return false;

//           const returnedDate = new Date(note.returned_date);
//           const dcDate = new Date(note.dc_date);

//           let shouldIncludeInResponse = false;
//           let shouldSubtractDevices = false;

//           if (invoice.payment_mode === "Postpaid") {
//             shouldSubtractDevices =
//               returnedDate >= invoiceStart && returnedDate <= invoiceEnd;
//             shouldIncludeInResponse = shouldSubtractDevices;
//           } else if (invoice.payment_mode === "Prepaid") {
//             shouldSubtractDevices = returnedDate < invoiceStart;

//             const expectedReturnMonth = new Date(invoiceStart);
//             expectedReturnMonth.setMonth(expectedReturnMonth.getMonth() - 1);

//             const isExpectedMonth =
//               returnedDate.getMonth() === expectedReturnMonth.getMonth() &&
//               returnedDate.getFullYear() === expectedReturnMonth.getFullYear();

//             const sameMonth =
//               dcDate.getMonth() === returnedDate.getMonth() &&
//               dcDate.getFullYear() === returnedDate.getFullYear();

//             shouldIncludeInResponse = isExpectedMonth && sameMonth;
//           }

//           if (shouldSubtractDevices) {
//             note.items.forEach((ri) => {
//               allReturnedFromCreditNotes.push(...parseJSONSafe(ri.device_ids));
//             });
//           }

//           return shouldIncludeInResponse;
//         });

//       // 5. Additional challans - ONLY peripheral_update = false + same payment_mode + not Buy
// const otherChallans = await DeliveryChallan.findAll({
//   where: {
//     [Op.and]: [
//       { customer_code: invoice.customer_id.toString() },
//       { dispatch_order_id: { [Op.ne]: invoice.dispatch_order_id } },
//       { dc_date: { [Op.lt]: invoiceDcDate } },
//       { peripheral_update: false },
//       { payment_type: invoice.payment_mode },   // ✅ match Prepaid/Postpaid
//     ],
//   },
//   include: [
//     {
//       model: DeliveryChallanItem,
//       as: "items",
//       include: [{ model: ProductTemplete, as: "product" }],
//     },
//   ],
//   order: [["dc_date", "ASC"]],
// });


//       for (const challan of otherChallans) {
//         // Check if challan should be included based on order_sale_date and invoice_start_date
//         if (!shouldIncludeChallan(challan.order_sale_date, invoice.invoice_start_date)) {
//           continue; // Skip this challan if it's from a future month
//         }

//         const challanCreditNotes = await CreditNote.findAll({
//           where: { dispatch_order_id: challan.dispatch_order_id },
//           include: [{ model: CreditNoteItem, as: "items" }],
//         });

//         let allReturnedForChallan = [];

//         const challanFilteredCreditNotes = challanCreditNotes
//           .map((note) => note.toJSON())
//           .filter((note) => {
//             if (!note.returned_date || !note.dc_date) return false;

//             const returnedDate = new Date(note.returned_date);
//             const dcDate = new Date(note.dc_date);

//             let shouldIncludeInResponse = false;
//             let shouldSubtractDevices = false;

//             if (invoice.payment_mode === "Postpaid") {
//               const challanEndDate = new Date(challan.dc_date);
//               challanEndDate.setMonth(challanEndDate.getMonth() + 1);

//               shouldSubtractDevices =
//                 returnedDate >= new Date(challan.dc_date) &&
//                 returnedDate <= challanEndDate;
//               shouldIncludeInResponse = shouldSubtractDevices;
//             } else if (invoice.payment_mode === "Prepaid") {
//               shouldSubtractDevices = returnedDate < invoiceStart;

//               const expectedReturnMonth = new Date(challan.dc_date);
//               expectedReturnMonth.setMonth(expectedReturnMonth.getMonth() + 1);

//               const isExpectedMonth =
//                 returnedDate.getMonth() === expectedReturnMonth.getMonth() &&
//                 returnedDate.getFullYear() === expectedReturnMonth.getFullYear();

//               const sameMonth =
//                 dcDate.getMonth() === returnedDate.getMonth() &&
//                 dcDate.getFullYear() === returnedDate.getFullYear();

//               shouldIncludeInResponse = isExpectedMonth && sameMonth;
//             }

//             if (shouldSubtractDevices) {
//               note.items.forEach((ri) => {
//                 allReturnedForChallan.push(...parseJSONSafe(ri.device_ids));
//               });
//             }

//             return shouldIncludeInResponse;
//           });

//         const challanJSON = challan.toJSON();
//         challanJSON.credit_notes = challanFilteredCreditNotes;

//         challanJSON.items = challanJSON.items.map((item) => {
//           const originalDeviceIds = parseJSONSafe(item.device_ids);
//           const updatedDeviceIds = originalDeviceIds.filter(
//             (id) => !allReturnedForChallan.includes(id)
//           );

//           return {
//             ...item,
//             device_ids: updatedDeviceIds,
//             quantity: updatedDeviceIds.length,
//           };
//         });

//         additionalDeliveryChallans.push(challanJSON);
//       }
//     }

//     // 6. Adjust main invoice items and get peripherals
//     const updatedItems = [];
//     for (const item of invoice.items) {
//       const device_ids = parseJSONSafe(item.device_ids);
//       const returned_device_ids = parseJSONSafe(item.returned_device_ids);

//       const remaining_device_ids =
//         invoice.transaction_type === "Buy"
//           ? device_ids
//           : device_ids.filter(
//               (id) =>
//                 !returned_device_ids.includes(id) &&
//                 !allReturnedFromCreditNotes.includes(id)
//             );

//       // Get peripherals for devices delivered before invoice start month
//       const peripheralItems = await getPeripheralsForDevices(
//         item.product_id,
//         remaining_device_ids,
//         invoiceStart
//       );

//       updatedItems.push({
//         ...item.toJSON(),
//         device_ids,
//         returned_device_ids,
//         remaining_device_ids,
//         peripheralItems // Add peripherals to the item
//       });
//     }

//     // 7. Get peripherals for additional delivery challan items
//     for (const challan of additionalDeliveryChallans) {
//       for (const item of challan.items) {
//         const device_ids = parseJSONSafe(item.device_ids);

//         // Get peripherals for devices delivered before invoice start month
//         const peripheralItems = await getPeripheralsForDevices(
//           item.product_id,
//           device_ids,
//           invoiceStart
//         );

//         item.peripheralItems = peripheralItems;
//       }
//     }

//     // 8. Final API response
//     const invoiceJSON = invoice.toJSON();
//     invoiceJSON.items = updatedItems;
//     invoiceJSON.order_table_id = order_table_id;
//     invoiceJSON.order_date = order_date;
//     invoiceJSON.credit_notes = filteredCreditNotes;
//     invoiceJSON.additional_delivery_challans = additionalDeliveryChallans;
//     invoiceJSON.rental_start_date = invoice.rental_start_date;
//     invoiceJSON.rental_end_date = invoice.rental_end_date;

//     return res.status(200).json(invoiceJSON);
//   } catch (error) {
//     console.error("Error fetching invoice:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };




///06-09-25


// export const getInvoiceById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Helper: month difference calculation (from first example)
//     const monthDiff = (date1, date2) => {
//       return (date2.getFullYear() - date1.getFullYear()) * 12 + 
//              (date2.getMonth() - date1.getMonth());
//     };

//     // Helper: safe JSON parse
//     const parseJSONSafe = (input) => {
//       try {
//         if (typeof input === "string") return JSON.parse(input);
//         return Array.isArray(input) ? input : [];
//       } catch {
//         return [];
//       }
//     };

//     // Helper: Get peripherals for devices
//     const getPeripheralsForDevices = async (productId, deviceIds, invoiceStartDate) => {
//       if (!deviceIds || deviceIds.length === 0) return [];

//       const peripherals = await Peripheral.findAll({
//         where: {
//           parent_product_id: productId,
//           parent_asset_id: { [Op.in]: deviceIds },
//           approved_date: { [Op.lt]: invoiceStartDate }
//         },
//         include: [{
//           model: PeripheralItem,
//           as: "items"
//         }]
//       });

//       return peripherals.map(p => p.toJSON());
//     };

//     // Helper: Check if challan should be included based on dates
//     const shouldIncludeChallan = (challanOrderSaleDate, invoiceStartDate) => {
//       // If challan.order_sale_date is NULL → always include
//       if (!challanOrderSaleDate) return true;
//       if (!invoiceStartDate) return false;

//       const challanDate = new Date(challanOrderSaleDate);
//       const invoiceStart = new Date(invoiceStartDate);

//       // Reset both dates to the first day of their respective months for accurate comparison
//       const challanMonth = new Date(challanDate.getFullYear(), challanDate.getMonth(), 1);
//       const invoiceMonth = new Date(invoiceStart.getFullYear(), invoiceStart.getMonth(), 1);

//       // Same month
//       const sameMonth = challanMonth.getTime() === invoiceMonth.getTime();
//       // Only include challans same month or AFTER invoice month
//       const challanAfterInvoice = challanMonth >= invoiceMonth;

//       return sameMonth || challanAfterInvoice;
//     };

//     // 1. Fetch invoice
//     const invoice = await Invoice.findByPk(id, {
//       include: [
//         {
//           model: InvoiceItem,
//           as: "items",
//           include: [
//             {
//               model: ProductTemplete,
//               as: "productDetails",
//             },
//           ],
//         },
//         {
//           model: InvoiceShippingDetail,
//           as: "shippingDetail",
//         },
//       ],
//     });

//     if (!invoice) {
//       return res.status(404).json({ message: "Invoice not found" });
//     }

//     // 2. Related order info
//     const order = await Order.findByPk(invoice.order_id);
//     const order_date = order?.order_date || null;
//     const order_table_id = order?.order_id || null;

//     // 3. Important dates
//     const invoiceStart = new Date(invoice.invoice_start_date);
//     const invoiceEnd = new Date(invoice.invoice_end_date);
//     const invoiceDcDate = new Date(invoice.dc_date);

//     let filteredCreditNotes = [];
//     let allReturnedFromCreditNotes = [];
//     let additionalDeliveryChallans = [];

//     // Only process credit notes and additional challans if not a Buy transaction
//     if (invoice.transaction_type !== "Buy") {
//       // 4. Credit notes for main challan - UPDATED WITH PREPAID LOGIC
//       const creditNotes = await CreditNote.findAll({
//         where: { dispatch_order_id: invoice.dispatch_order_id },
//         include: [{ model: CreditNoteItem, as: "items" }],
//       });

//       // Process credit notes based on payment mode (using logic from first example)
//       const [displayCreditNotes, processOnlyCreditNotes] = creditNotes.reduce(
//         ([display, process], note) => {
//           const noteData = note.toJSON();
//           if (!noteData.returned_date) return [display, process];

//           const returnedDate = new Date(noteData.returned_date);
//           const invoiceStartDate = new Date(invoice.invoice_start_date);
//           const dcDate = new Date(invoice.dc_date);

//           const diffDC = monthDiff(dcDate, returnedDate);
//           const diffInvoice = monthDiff(invoiceStartDate, returnedDate);

//           // SPECIFIC CONDITIONS FOR PREPAID CREDIT NOTES
//           if (invoice.payment_mode === 'Prepaid') {
//             // Display only if BOTH conditions are met:
//             // 1. Returned date is in same month as DC date (diffDC === 0)
//             // 2. Returned date is exactly 1 month BEFORE invoice start date (diffInvoice === -1)
//             if (diffDC === 0 && diffInvoice === -1) {
//               return [[...display, noteData], process];
//             }
//             // Special case: Process but don't display credit notes with returned dates:
//             // - After DC date
//             // - Before invoice start date
//             // - Not meeting the display conditions above
//             if (returnedDate > dcDate && returnedDate < invoiceStartDate) {
//               return [display, [...process, noteData]];
//             }
//             return [display, process];
//           } 
//           // Postpaid logic - show credit notes from same month as invoice start
//           else if (invoice.payment_mode === 'Postpaid') {
//             if (diffInvoice === 0) {
//               return [[...display, noteData], process];
//             }
//             return [display, process];
//           }
//           return [display, process];
//         },
//         [[], []]
//       );

//       filteredCreditNotes = displayCreditNotes;

//       // Collect all returned device IDs from both displayed and process-only notes
//       [...displayCreditNotes, ...processOnlyCreditNotes].forEach((note) => {
//         note.items.forEach((ri) => {
//           allReturnedFromCreditNotes.push(...parseJSONSafe(ri.device_ids));
//         });
//       });

//       // 5. Additional challans - ONLY peripheral_update = false + same payment_mode + not Buy
//       const otherChallans = await DeliveryChallan.findAll({
//         where: {
//           [Op.and]: [
//             { customer_code: invoice.customer_id.toString() },
//             { dispatch_order_id: { [Op.ne]: invoice.dispatch_order_id } },
//             { dc_date: { [Op.lt]: invoiceDcDate } },
//             { peripheral_update: false },
//             { payment_type: invoice.payment_mode },
//           ],
//         },
//         include: [
//           {
//             model: DeliveryChallanItem,
//             as: "items",
//             include: [{ model: ProductTemplete, as: "product" }],
//           },
//         ],
//         order: [["dc_date", "ASC"]],
//       });

//       for (const challan of otherChallans) {
//         // Check if challan should be included based on order_sale_date and invoice_start_date
//         if (!shouldIncludeChallan(challan.order_sale_date, invoice.invoice_start_date)) {
//           continue; // Skip this challan if it's from a future month
//         }

//         const challanCreditNotes = await CreditNote.findAll({
//           where: { dispatch_order_id: challan.dispatch_order_id },
//           include: [{ model: CreditNoteItem, as: "items" }],
//         });

//         // Process additional challan credit notes with the same logic
//         const [displayChallanNotes, processChallanNotes] = challanCreditNotes.reduce(
//           ([display, process], note) => {
//             const noteData = note.toJSON();
//             if (!noteData.returned_date) return [display, process];

//             const returnedDate = new Date(noteData.returned_date);
//             const invoiceStartDate = new Date(invoice.invoice_start_date);
//             const dcDate = new Date(challan.dc_date);

//             const diffDC = monthDiff(dcDate, returnedDate);
//             const diffInvoice = monthDiff(invoiceStartDate, returnedDate);

//             // Apply the same Prepaid conditions to additional challans
//             if (invoice.payment_mode === 'Prepaid') {
//               if (diffDC === 0 && diffInvoice === -1) {
//                 return [[...display, noteData], process];
//               }
//               // Special case: Process but don't display
//               if (returnedDate > dcDate && returnedDate < invoiceStartDate) {
//                 return [display, [...process, noteData]];
//               }
//             } else if (invoice.payment_mode === 'Postpaid') {
//               if (diffInvoice === 0) {
//                 return [[...display, noteData], process];
//               }
//             }
//             return [display, process];
//           },
//           [[], []]
//         );

//         let allReturnedForChallan = [];

//         // Collect returned devices from both displayed and process-only notes
//         [...displayChallanNotes, ...processChallanNotes].forEach((note) => {
//           note.items.forEach((ri) => {
//             allReturnedForChallan.push(...parseJSONSafe(ri.device_ids));
//           });
//         });

//         const challanJSON = challan.toJSON();
//         challanJSON.credit_notes = displayChallanNotes;

//         challanJSON.items = challanJSON.items.map((item) => {
//           const originalDeviceIds = parseJSONSafe(item.device_ids);
//           const updatedDeviceIds = originalDeviceIds.filter(
//             (id) => !allReturnedForChallan.includes(id)
//           );

//           return {
//             ...item,
//             device_ids: updatedDeviceIds,
//             quantity: updatedDeviceIds.length,
//           };
//         });

//         additionalDeliveryChallans.push(challanJSON);
//       }
//     }

//     // 6. Adjust main invoice items and get peripherals
//     const updatedItems = [];
//     for (const item of invoice.items) {
//       const device_ids = parseJSONSafe(item.device_ids);
//       const returned_device_ids = parseJSONSafe(item.returned_device_ids);

//       const remaining_device_ids =
//         invoice.transaction_type === "Buy"
//           ? device_ids
//           : device_ids.filter(
//               (id) =>
//                 !returned_device_ids.includes(id) &&
//                 !allReturnedFromCreditNotes.includes(id)
//             );

//       // Get peripherals for devices delivered before invoice start month
//       const peripheralItems = await getPeripheralsForDevices(
//         item.product_id,
//         remaining_device_ids,
//         invoiceStart
//       );

//       updatedItems.push({
//         ...item.toJSON(),
//         device_ids,
//         returned_device_ids,
//         remaining_device_ids,
//         peripheralItems // Add peripherals to the item
//       });
//     }

//     // 7. Get peripherals for additional delivery challan items
//     for (const challan of additionalDeliveryChallans) {
//       for (const item of challan.items) {
//         const device_ids = parseJSONSafe(item.device_ids);

//         // Get peripherals for devices delivered before invoice start month
//         const peripheralItems = await getPeripheralsForDevices(
//           item.product_id,
//           device_ids,
//           invoiceStart
//         );

//         item.peripheralItems = peripheralItems;
//       }
//     }

//     // 8. Final API response
//     const invoiceJSON = invoice.toJSON();
//     invoiceJSON.items = updatedItems;
//     invoiceJSON.order_table_id = order_table_id;
//     invoiceJSON.order_date = order_date;
//     invoiceJSON.credit_notes = filteredCreditNotes;
//     invoiceJSON.additional_delivery_challans = additionalDeliveryChallans;
//     invoiceJSON.rental_start_date = invoice.rental_start_date;
//     invoiceJSON.rental_end_date = invoice.rental_end_date;

//     return res.status(200).json(invoiceJSON);
//   } catch (error) {
//     console.error("Error fetching invoice:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };



///08-09-25


// export const getInvoiceById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Helpers
//     const monthDiff = (date1, date2) => {
//       return (
//         (date2.getFullYear() - date1.getFullYear()) * 12 +
//         (date2.getMonth() - date1.getMonth())
//       );
//     };

//     const parseJSONSafe = (input) => {
//       try {
//         if (typeof input === "string") return JSON.parse(input);
//         return Array.isArray(input) ? input : [];
//       } catch {
//         return [];
//       }
//     };

//     const getPeripheralsForDevices = async (
//       productId,
//       deviceIds,
//       invoiceStartDate
//     ) => {
//       if (!deviceIds || deviceIds.length === 0) return [];
//       const peripherals = await Peripheral.findAll({
//         where: {
//           parent_product_id: productId,
//           parent_asset_id: { [Op.in]: deviceIds },
//           approved_date: { [Op.lt]: invoiceStartDate }
//         },
//         include: [{ model: PeripheralItem, as: "items" }]
//       });
//       return peripherals.map((p) => p.toJSON());
//     };

//     const shouldIncludeChallan = (challanOrderSaleDate, invoiceStartDate) => {
//       if (!challanOrderSaleDate) return true;
//       if (!invoiceStartDate) return false;
//       const challanDate = new Date(challanOrderSaleDate);
//       const invoiceStart = new Date(invoiceStartDate);
//       const challanMonth = new Date(
//         challanDate.getFullYear(),
//         challanDate.getMonth(),
//         1
//       );
//       const invoiceMonth = new Date(
//         invoiceStart.getFullYear(),
//         invoiceStart.getMonth(),
//         1
//       );
//       return (
//         challanMonth.getTime() === invoiceMonth.getTime() ||
//         challanMonth >= invoiceMonth
//       );
//     };

//     const filterRemainingDevices = (originalIds, returnedIds, swappedIds) => {
//       return originalIds.filter(
//         (id) => !returnedIds.includes(id) && !swappedIds.includes(id)
//       );
//     };

//     // Fetch invoice
//     const invoice = await Invoice.findByPk(id, {
//       include: [
//         {
//           model: InvoiceItem,
//           as: "items",
//           include: [{ model: ProductTemplete, as: "productDetails" }]
//         },
//         { model: InvoiceShippingDetail, as: "shippingDetail" }
//       ]
//     });

//     if (!invoice) {
//       return res.status(404).json({ message: "Invoice not found" });
//     }

//     // Order info
//     const order = await Order.findByPk(invoice.order_id);
//     const order_date = order?.order_date || null;
//     const order_table_id = order?.order_id || null;

//     // Important dates
//     const invoiceStart = new Date(invoice.invoice_start_date);
//     const invoiceEnd = new Date(invoice.invoice_end_date);
//     const invoiceDcDate = new Date(invoice.dc_date);

//     let filteredCreditNotes = [];
//     let allReturnedFromCreditNotes = [];
//     let additionalDeliveryChallans = [];
//     let filteredAssetSwaps = [];
//     let allSwappedDeviceIds = [];

//     if (invoice.transaction_type !== "Buy") {
//       // Credit notes
//       const creditNotes = await CreditNote.findAll({
//         where: { dispatch_order_id: invoice.dispatch_order_id },
//         include: [{ model: CreditNoteItem, as: "items" }]
//       });

//       const [displayCreditNotes, processOnlyCreditNotes] = creditNotes.reduce(
//         ([display, process], note) => {
//           const noteData = note.toJSON();
//           if (!noteData.returned_date) return [display, process];
//           const returnedDate = new Date(noteData.returned_date);
//           const invoiceStartDate = new Date(invoice.invoice_start_date);
//           const dcDate = new Date(invoice.dc_date);
//           const diffDC = monthDiff(dcDate, returnedDate);
//           const diffInvoice = monthDiff(invoiceStartDate, returnedDate);

//           if (invoice.payment_mode === "Prepaid") {
//             if (diffDC === 0 && diffInvoice === -1) {
//               return [[...display, noteData], process];
//             }
//             if (returnedDate > dcDate && returnedDate < invoiceStartDate) {
//               return [display, [...process, noteData]];
//             }
//             return [display, process];
//           } else if (invoice.payment_mode === "Postpaid") {
//             if (diffInvoice === 0) {
//               return [[...display, noteData], process];
//             }
//             return [display, process];
//           }
//           return [display, process];
//         },
//         [[], []]
//       );

//       filteredCreditNotes = displayCreditNotes;
//       [...displayCreditNotes, ...processOnlyCreditNotes].forEach((note) => {
//         note.items.forEach((ri) => {
//           allReturnedFromCreditNotes.push(...parseJSONSafe(ri.device_ids));
//         });
//       });

//       // Asset swaps
//       const assetSwaps = await AssetSwap.findAll({
//         where: {
//           product_id: { [Op.in]: invoice.items.map((i) => i.product_id) },
//           swapped_on: { [Op.lte]: invoiceEnd }
//         },
//         order: [["swapped_on", "ASC"]]
//       });

//       for (const swap of assetSwaps) {
//         const swapData = swap.toJSON();
//         const swappedDate = new Date(swapData.swapped_on);
//         const diffDC = monthDiff(invoiceDcDate, swappedDate);
//         const diffInvoice = monthDiff(invoiceStart, swappedDate);

//         // Always subtract asset_id
//         allSwappedDeviceIds.push(swapData.asset_id);

//         // Include based on rules
//         if (
//           (invoice.payment_mode === "Prepaid" && diffDC === 0 && diffInvoice === -1) ||
//           (invoice.payment_mode === "Postpaid" && diffInvoice === 0)
//         ) {
//           filteredAssetSwaps.push(swapData);
//         }
//       }

//       // Additional challans
//       const otherChallans = await DeliveryChallan.findAll({
//         where: {
//           [Op.and]: [
//             { customer_code: invoice.customer_id.toString() },
//             { dispatch_order_id: { [Op.ne]: invoice.dispatch_order_id } },
//             { dc_date: { [Op.lt]: invoiceDcDate } },
//             { peripheral_update: false },
//             { payment_type: invoice.payment_mode }
//           ]
//         },
//         include: [
//           {
//             model: DeliveryChallanItem,
//             as: "items",
//             include: [{ model: ProductTemplete, as: "product" }]
//           }
//         ],
//         order: [["dc_date", "ASC"]]
//       });

//       for (const challan of otherChallans) {
//         if (!shouldIncludeChallan(challan.order_sale_date, invoice.invoice_start_date))
//           continue;

//         const challanCreditNotes = await CreditNote.findAll({
//           where: { dispatch_order_id: challan.dispatch_order_id },
//           include: [{ model: CreditNoteItem, as: "items" }]
//         });

//         const [displayChallanNotes, processChallanNotes] =
//           challanCreditNotes.reduce(
//             ([display, process], note) => {
//               const noteData = note.toJSON();
//               if (!noteData.returned_date) return [display, process];
//               const returnedDate = new Date(noteData.returned_date);
//               const invoiceStartDate = new Date(invoice.invoice_start_date);
//               const dcDate = new Date(challan.dc_date);
//               const diffDC = monthDiff(dcDate, returnedDate);
//               const diffInvoice = monthDiff(invoiceStartDate, returnedDate);

//               if (invoice.payment_mode === "Prepaid") {
//                 if (diffDC === 0 && diffInvoice === -1) return [[...display, noteData], process];
//                 if (returnedDate > dcDate && returnedDate < invoiceStartDate)
//                   return [display, [...process, noteData]];
//               } else if (invoice.payment_mode === "Postpaid") {
//                 if (diffInvoice === 0) return [[...display, noteData], process];
//               }
//               return [display, process];
//             },
//             [[], []]
//           );

//         let allReturnedForChallan = [];
//         [...displayChallanNotes, ...processChallanNotes].forEach((note) => {
//           note.items.forEach((ri) => {
//             allReturnedForChallan.push(...parseJSONSafe(ri.device_ids));
//           });
//         });

//         const challanJSON = challan.toJSON();
//         challanJSON.credit_notes = displayChallanNotes;

//         challanJSON.items = challanJSON.items.map((item) => {
//           const originalDeviceIds = parseJSONSafe(item.device_ids);
//           const updatedDeviceIds = filterRemainingDevices(
//             originalDeviceIds,
//             allReturnedForChallan,
//             allSwappedDeviceIds
//           );
//           return {
//             ...item,
//             device_ids: updatedDeviceIds,
//             quantity: updatedDeviceIds.length
//           };
//         });

//         additionalDeliveryChallans.push(challanJSON);
//       }
//     }

//     // Main invoice items
//     const updatedItems = [];
//     for (const item of invoice.items) {
//       const device_ids = parseJSONSafe(item.device_ids);
//       const returned_device_ids = parseJSONSafe(item.returned_device_ids);

//       const remaining_device_ids =
//         invoice.transaction_type === "Buy"
//           ? device_ids
//           : filterRemainingDevices(
//               device_ids,
//               [...returned_device_ids, ...allReturnedFromCreditNotes],
//               allSwappedDeviceIds
//             );

//       const peripheralItems = await getPeripheralsForDevices(
//         item.product_id,
//         remaining_device_ids,
//         invoiceStart
//       );

//       updatedItems.push({
//         ...item.toJSON(),
//         device_ids,
//         returned_device_ids,
//         remaining_device_ids,
//         peripheralItems
//       });
//     }

//     // Peripherals for additional challans
//     for (const challan of additionalDeliveryChallans) {
//       for (const item of challan.items) {
//         const device_ids = parseJSONSafe(item.device_ids);
//         const peripheralItems = await getPeripheralsForDevices(
//           item.product_id,
//           device_ids,
//           invoiceStart
//         );
//         item.peripheralItems = peripheralItems;
//       }
//     }

//     // Final response
//     const invoiceJSON = invoice.toJSON();
//     invoiceJSON.items = updatedItems;
//     invoiceJSON.order_table_id = order_table_id;
//     invoiceJSON.order_date = order_date;
//     invoiceJSON.credit_notes = filteredCreditNotes;
//     invoiceJSON.asset_swaps = filteredAssetSwaps;
//     invoiceJSON.additional_delivery_challans = additionalDeliveryChallans;
//     invoiceJSON.rental_start_date = invoice.rental_start_date;
//     invoiceJSON.rental_end_date = invoice.rental_end_date;

//     return res.status(200).json(invoiceJSON);
//   } catch (error) {
//     console.error("Error fetching invoice:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined
//     });
//   }
// };




//17-09-2025

// export const getInvoiceById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Helpers
//     const monthDiff = (date1, date2) =>
//       (date2.getFullYear() - date1.getFullYear()) * 12 +
//       (date2.getMonth() - date1.getMonth());

//     const parseJSONSafe = (input) => {
//       try {
//         if (typeof input === "string") return JSON.parse(input);
//         return Array.isArray(input) ? input : [];
//       } catch {
//         return [];
//       }
//     };

//     const getPeripheralsForDevices = async (productId, deviceIds, invoiceStartDate) => {
//       if (!deviceIds || deviceIds.length === 0) return [];
//       const peripherals = await Peripheral.findAll({
//         where: {
//           parent_product_id: productId,
//           parent_asset_id: {
//             [Op.in]: deviceIds
//           },
//           approved_date: {
//             [Op.lt]: invoiceStartDate
//           },
//         },
//         include: [{
//           model: PeripheralItem,
//           as: "items"
//         }],
//       });
//       return peripherals.map((p) => p.toJSON());
//     };

//     const shouldIncludeChallan = (challanOrderSaleDate, invoiceStartDate) => {
//       if (!challanOrderSaleDate) return true;
//       if (!invoiceStartDate) return false;
//       const challanDate = new Date(challanOrderSaleDate);
//       const invoiceStart = new Date(invoiceStartDate);
//       const challanMonth = new Date(challanDate.getFullYear(), challanDate.getMonth(), 1);
//       const invoiceMonth = new Date(invoiceStart.getFullYear(), invoiceStart.getMonth(), 1);
//       return challanMonth.getTime() === invoiceMonth.getTime() || challanMonth >= invoiceMonth;
//     };

//     const filterRemainingDevices = (originalIds, returnedIds, swappedIds) => {
//       return originalIds.filter((id) => !returnedIds.includes(id) && !swappedIds.includes(id));
//     };

//     // Count invoices with same dispatch_order_id whose ID is <= current
//     const countDispatchOrderUpToCurrent = async (dispatchOrderId, currentInvoiceId) => {
//       if (!dispatchOrderId) return 0;
//       return await Invoice.count({
//         where: {
//           dispatch_order_id: dispatchOrderId,
//           id: {
//             [Op.lte]: currentInvoiceId
//           },
//         },
//       });
//     };

//     // Fetch invoice
//     const invoice = await Invoice.findByPk(id, {
//       include: [{
//           model: InvoiceItem,
//           as: "items",
//           include: [{
//             model: ProductTemplete,
//             as: "productDetails"
//           }],
//         },
//         {
//           model: InvoiceShippingDetail,
//           as: "shippingDetail"
//         },
//       ],
//     });

//     if (!invoice) return res.status(404).json({
//       message: "Invoice not found"
//     });

//     // Count how many times main invoice's dispatch_order_id was created up to this invoice
//     const mainDispatchOrderCount = await countDispatchOrderUpToCurrent(invoice.dispatch_order_id, invoice.id);

//     // Order info
//     const order = await Order.findByPk(invoice.order_id);
//     const order_date = order?.order_date || null;
//     const order_table_id = order?.order_id || null;

//     // Important dates
//     const invoiceStart = new Date(invoice.invoice_start_date);
//     const invoiceEnd = new Date(invoice.invoice_end_date);
//     const invoiceDcDate = new Date(invoice.dc_date);

//     let filteredCreditNotes = [];
//     let allReturnedFromCreditNotes = [];
//     let additionalDeliveryChallans = [];
//     const sameMonth = monthDiff(invoiceDcDate, invoiceStart) === 0;


//     let filteredAssetSwaps = [];
//     let allSwappedDeviceIds = [];

//     if (invoice.transaction_type !== "Buy") {
//       // Get ALL asset swaps first to build complete list of swapped devices
//       const allAssetSwaps = await AssetSwap.findAll({
//         where: {
//           swapped_on: {
//             [Op.lte]: invoiceEnd
//           },
//         },
//       });

//       // Build complete list of swapped device IDs
//       allSwappedDeviceIds = allAssetSwaps.map(swap => swap.asset_id);

//       // Credit notes
//       const creditNotes = await CreditNote.findAll({
//         where: {
//           dispatch_order_id: invoice.dispatch_order_id,
//           transaction_type: {
//             [Op.ne]: "Asset Swap"
//           }
//         },
//         include: [{
//           model: CreditNoteItem,
//           as: "items"
//         }],
//       });

//       const [displayCreditNotes, processOnlyCreditNotes] = creditNotes.reduce(
//         ([display, process], note) => {
//           const noteData = note.toJSON();

//           // 🚫 Skip Asset Swap credit notes completely
//           if (noteData.transaction_type === "Asset Swap") return [display, process];

//           if (!noteData.returned_date) return [display, process];
//           const returnedDate = new Date(noteData.returned_date);
//           const invoiceStartDate = new Date(invoice.invoice_start_date);
//           const dcDate = new Date(invoice.dc_date);
//           const diffDC = monthDiff(dcDate, returnedDate);
//           const diffInvoice = monthDiff(invoiceStartDate, returnedDate);

//           if (invoice.payment_mode === "Prepaid") {
//             if (diffDC === 0 && diffInvoice === -1) return [
//               [...display, noteData], process
//             ];
//             if (returnedDate > dcDate && returnedDate < invoiceStartDate) return [display, [...process, noteData]];
//             return [display, process];
//           } else if (invoice.payment_mode === "Postpaid") {
//             if (diffInvoice === 0) return [
//               [...display, noteData], process
//             ];
//             return [display, process];
//           }
//           return [display, process];
//         },
//         [
//           [],
//           []
//         ]
//       );

//       filteredCreditNotes = displayCreditNotes;

//       // Collect returned devices (skip Asset Swap notes)
//       [...displayCreditNotes, ...processOnlyCreditNotes].forEach((note) => {
//         if (note.transaction_type !== "Asset Swap") {
//           note.items.forEach((ri) => {
//             allReturnedFromCreditNotes.push(...parseJSONSafe(ri.device_ids));
//           });
//         }
//       });

//       // Filter asset swaps for display
//       for (const swap of allAssetSwaps) {
//         const swapData = swap.toJSON();
//         const swappedDate = new Date(swapData.swapped_on);
//         const diffDC = monthDiff(invoiceDcDate, swappedDate);
//         const diffInvoice = monthDiff(invoiceStart, swappedDate);

//         if (
//           (invoice.payment_mode === "Prepaid" && diffDC === 0 && diffInvoice === -1) ||
//           (invoice.payment_mode === "Postpaid" && diffInvoice === 0)
//         ) {
//           filteredAssetSwaps.push(swapData);
//         }
//       }

//       // Additional challans

// if (!(invoice.payment_mode === "Prepaid" && sameMonth)) {

//         const otherChallans = await DeliveryChallan.findAll({
//         where: {
//           customer_code: invoice.customer_id.toString(),
//           dispatch_order_id: {
//             [Op.ne]: invoice.dispatch_order_id
//           },
//           dc_date: {
//             [Op.lt]: invoiceDcDate
//           },
//           peripheral_update: false,
//           payment_type: invoice.payment_mode,
//         },
//         include: [{
//           model: DeliveryChallanItem,
//           as: "items",
//           include: [{
//             model: ProductTemplete,
//             as: "product"
//           }],
//         }, ],
//         order: [
//           ["dc_date", "ASC"]
//         ],
//       });

//       for (const challan of otherChallans) {
//         const challanDate = new Date(challan.dc_date);

//         // 🚫 Skip challan completely if challan.dc_date and invoice_start_date are the SAME MONTH
//         if (
//           invoice.payment_mode === "Prepaid" &&
//           monthDiff(challanDate, invoiceStart) === 0
//         ) {
//           continue;
//         }

//         if (!shouldIncludeChallan(challan.order_sale_date, invoice.invoice_start_date)) continue;

//         // process challan...
//         const challanCreditNotes = await CreditNote.findAll({
//           where: {
//             dispatch_order_id: challan.dispatch_order_id,
//             transaction_type: {
//               [Op.ne]: "Asset Swap" // ← EXCLUDE Asset Swap credit notes
//             }
//           },
//           include: [{
//             model: CreditNoteItem,
//             as: "items"
//           }],
//         });

//         const [displayChallanNotes, processChallanNotes] = challanCreditNotes.reduce(
//           ([display, process], note) => {
//             const noteData = note.toJSON();
//             if (noteData.transaction_type === "Asset Swap") return [display, process];
//             if (!noteData.returned_date) return [display, process];

//             const returnedDate = new Date(noteData.returned_date);
//             const invoiceStartDate = new Date(invoice.invoice_start_date);
//             const dcDate = new Date(challan.dc_date);
//             const diffDC = monthDiff(dcDate, returnedDate);
//             const diffInvoice = monthDiff(invoiceStartDate, returnedDate);

//             if (invoice.payment_mode === "Prepaid") {
//               if (diffDC === 0 && diffInvoice === -1) return [
//                 [...display, noteData], process
//               ];
//               if (returnedDate > dcDate && returnedDate < invoiceStartDate) return [display, [...process, noteData]];
//             } else if (invoice.payment_mode === "Postpaid") {
//               if (diffInvoice === 0) return [
//                 [...display, noteData], process
//               ];
//             }
//             return [display, process];
//           },
//           [
//             [],
//             []
//           ]
//         );

//         let allReturnedForChallan = [];
//         [...displayChallanNotes, ...processChallanNotes].forEach((note) => {
//           if (note.transaction_type !== "Asset Swap") {
//             note.items.forEach((ri) => {
//               allReturnedForChallan.push(...parseJSONSafe(ri.device_ids));
//             });
//           }
//         });

//         const challanJSON = challan.toJSON();
//         challanJSON.credit_notes = displayChallanNotes;

//         challanJSON.items = challanJSON.items.map((item) => {
//           const originalDeviceIds = parseJSONSafe(item.device_ids);
//           const updatedDeviceIds = filterRemainingDevices(originalDeviceIds, allReturnedForChallan, allSwappedDeviceIds);
//           return {
//             ...item,
//             device_ids: updatedDeviceIds,
//             quantity: updatedDeviceIds.length,
//           };
//         });

//         challanJSON.times_created_in_invoice = await countDispatchOrderUpToCurrent(
//           challan.dispatch_order_id,
//           invoice.id
//         );

//         additionalDeliveryChallans.push(challanJSON);
//       }

//       }

//     }

//     // Main invoice items
//     const updatedItems = [];
//     for (const item of invoice.items) {
//       const device_ids = parseJSONSafe(item.device_ids);
//       const returned_device_ids = parseJSONSafe(item.returned_device_ids);

//       const remaining_device_ids =
//         invoice.transaction_type === "Buy" ?
//         device_ids :
//         filterRemainingDevices(
//           device_ids,
//           [...returned_device_ids, ...allReturnedFromCreditNotes],
//           allSwappedDeviceIds
//         );

//       const peripheralItems = await getPeripheralsForDevices(item.product_id, remaining_device_ids, invoiceStart);

//       updatedItems.push({
//         ...item.toJSON(),
//         device_ids,
//         returned_device_ids,
//         remaining_device_ids,
//         peripheralItems,
//       });
//     }

//     // Peripherals for additional challans
//     for (const challan of additionalDeliveryChallans) {
//       for (const item of challan.items) {
//         const device_ids = parseJSONSafe(item.device_ids);
//         const peripheralItems = await getPeripheralsForDevices(item.product_id, device_ids, invoiceStart);
//         item.peripheralItems = peripheralItems;
//       }
//     }

//     // Final response
//     const invoiceJSON = invoice.toJSON();
//     invoiceJSON.items = updatedItems;
//     invoiceJSON.order_table_id = order_table_id;
//     invoiceJSON.order_date = order_date;
//     invoiceJSON.credit_notes = filteredCreditNotes;
//     invoiceJSON.asset_swaps = filteredAssetSwaps;
//     invoiceJSON.additional_delivery_challans = additionalDeliveryChallans;
//     invoiceJSON.rental_start_date = invoice.rental_start_date;
//     invoiceJSON.rental_end_date = invoice.rental_end_date;
//     invoiceJSON.times_created_in_invoice = mainDispatchOrderCount;

//     return res.status(200).json(invoiceJSON);
//   } catch (error) {
//     console.error("Error fetching invoice:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };





export const getInvoiceById = async (req, res) => {
  try {
    const {
      id
    } = req.params;

    // Helpers
    const monthDiff = (date1, date2) =>
      (date2.getFullYear() - date1.getFullYear()) * 12 +
      (date2.getMonth() - date1.getMonth());

    const parseJSONSafe = (input) => {
      try {
        if (typeof input === "string") return JSON.parse(input);
        return Array.isArray(input) ? input : [];
      } catch {
        return [];
      }
    };

    const getPeripheralsForDevices = async (productId, deviceIds, invoiceStartDate) => {
      if (!deviceIds || deviceIds.length === 0) return [];
      const peripherals = await Peripheral.findAll({
        where: {
          parent_product_id: productId,
          parent_asset_id: {
            [Op.in]: deviceIds
          },
          approved_date: {
            [Op.lt]: invoiceStartDate
          },
        },
        include: [{
          model: PeripheralItem,
          as: "items"
        }],
      });
      return peripherals.map((p) => p.toJSON());
    };

    const shouldIncludeChallan = (challanOrderSaleDate, invoiceStartDate) => {
      if (!challanOrderSaleDate) return true;
      if (!invoiceStartDate) return false;
      const challanDate = new Date(challanOrderSaleDate);
      const invoiceStart = new Date(invoiceStartDate);
      const challanMonth = new Date(challanDate.getFullYear(), challanDate.getMonth(), 1);
      const invoiceMonth = new Date(invoiceStart.getFullYear(), invoiceStart.getMonth(), 1);
      return challanMonth.getTime() === invoiceMonth.getTime() || challanMonth >= invoiceMonth;
    };

    const filterRemainingDevices = (originalIds, returnedIds, swappedIds) => {
      return originalIds.filter((id) => !returnedIds.includes(id) && !swappedIds.includes(id));
    };

    // Count invoices with same dispatch_order_id whose ID is <= current
    const countDispatchOrderUpToCurrent = async (dispatchOrderId, currentInvoiceId) => {
      if (!dispatchOrderId) return 0;
      return await Invoice.count({
        where: {
          dispatch_order_id: dispatchOrderId,
          id: {
            [Op.lte]: currentInvoiceId
          },
        },
      });
    };

    // NEW: Function to separate credit notes by month (from first version)
    const separateCreditNotesByMonth = (creditNotes, invoiceStartDate) => {
      const invoiceStart = new Date(invoiceStartDate);
      const invoiceStartMonth = invoiceStart.getMonth();
      const invoiceStartYear = invoiceStart.getFullYear();

      const sameMonthCreditNotes = [];
      const differentMonthCreditNotes = [];

      creditNotes.forEach((note) => {
        if (!note.returned_date) return;

        const returnedDate = new Date(note.returned_date);
        const returnedMonth = returnedDate.getMonth();
        const returnedYear = returnedDate.getFullYear();

        if (returnedMonth === invoiceStartMonth &&
          returnedYear === invoiceStartYear) {
          sameMonthCreditNotes.push(note);
        } else {
          differentMonthCreditNotes.push(note);
        }
      });

      return {
        sameMonthCreditNotes,
        differentMonthCreditNotes
      };
    };

    // Fetch invoice
    const invoice = await Invoice.findByPk(id, {
      include: [{
          model: InvoiceItem,
          as: "items",
          include: [{
            model: ProductTemplete,
            as: "productDetails"
          }],
        },
        {
          model: InvoiceShippingDetail,
          as: "shippingDetail"
        },
      ],
    });

    if (!invoice) return res.status(404).json({
      message: "Invoice not found"
    });





    // Count how many times main invoice's dispatch_order_id was created up to this invoice
    const mainDispatchOrderCount = await countDispatchOrderUpToCurrent(invoice.dispatch_order_id, invoice.id);

    // Order info
    const order = await Order.findByPk(invoice.order_id);
    const order_date = order?.order_date || null;
    const order_table_id = order?.order_id || null;

    // Important dates
    const invoiceStart = new Date(invoice.invoice_start_date);
    const invoiceEnd = new Date(invoice.invoice_end_date);
    const invoiceDcDate = new Date(invoice.dc_date);

    let filteredCreditNotes = [];
    let allReturnedFromCreditNotes = [];
    let additionalDeliveryChallans = [];
    const sameMonth = monthDiff(invoiceDcDate, invoiceStart) === 0;

    let filteredAssetSwaps = [];
    let allSwappedDeviceIds = [];


    // Fetch asset transactions for this invoice/customer
    let invoiceDeviceIds = invoice.items.flatMap((it) => parseJSONSafe(it.device_ids));


    additionalDeliveryChallans.forEach(ch => {
      ch.items.forEach(it => {
        invoiceDeviceIds.push(...parseJSONSafe(it.device_ids));
      });
    });




    if (invoice.transaction_type !== "Buy") {
      // Get ALL asset swaps first to build complete list of swapped devices
      const allAssetSwaps = await AssetSwap.findAll({
        where: {
          swapped_on: {
            [Op.lte]: invoiceEnd
          },
        },
      });

      // Build complete list of swapped device IDs
      allSwappedDeviceIds = allAssetSwaps.map(swap => swap.asset_id);

      // Credit notes - get ALL first
      const allCreditNotes = await CreditNote.findAll({
        where: {
          dispatch_order_id: invoice.dispatch_order_id,
          transaction_type: {
            [Op.notIn]: ["Asset Swap", "Asset Removed"]
          }
        },
        include: [{
          model: CreditNoteItem,
          as: "items"
        }],
      });

      // NEW: Apply the first version's approach to separate credit notes
      const allCreditNotesJSON = allCreditNotes.map(note => note.toJSON());
      const {
        sameMonthCreditNotes,
        differentMonthCreditNotes
      } =
      separateCreditNotesByMonth(allCreditNotesJSON, invoice.invoice_start_date);

      // Use the same-month credit notes for display
      filteredCreditNotes = sameMonthCreditNotes;

      // Collect returned devices from different-month credit notes for subtraction
      differentMonthCreditNotes.forEach((note) => {
        if (note.transaction_type !== "Asset Swap" || note.transaction_type !== "Asset Removed") {
          note.items.forEach((ri) => {
            allReturnedFromCreditNotes.push(...parseJSONSafe(ri.device_ids));
          });
        }
      });

      // Filter asset swaps for display
      for (const swap of allAssetSwaps) {
        const swapData = swap.toJSON();
        const swappedDate = new Date(swapData.swapped_on);
        const diffDC = monthDiff(invoiceDcDate, swappedDate);
        const diffInvoice = monthDiff(invoiceStart, swappedDate);

        if (
          (invoice.payment_mode === "Prepaid" && diffDC === 0 && diffInvoice === -1) ||
          (invoice.payment_mode === "Postpaid" && diffInvoice === 0)
        ) {
          filteredAssetSwaps.push(swapData);
        }
      }

      // Additional challans
      if (!(invoice.payment_mode === "Prepaid" && sameMonth)) {
        const otherChallans = await DeliveryChallan.findAll({
          where: {
            customer_code: invoice.customer_id.toString(),
            dispatch_order_id: {
              [Op.ne]: invoice.dispatch_order_id
            },
            dc_date: {
              [Op.lt]: invoiceDcDate
            },
            peripheral_update: false,
            payment_type: invoice.payment_mode,
          },
          include: [{
            model: DeliveryChallanItem,
            as: "items",
            include: [{
              model: ProductTemplete,
              as: "product"
            }],
          }, ],
          order: [
            ["dc_date", "ASC"]
          ],
        });

        for (const challan of otherChallans) {
          const challanDate = new Date(challan.dc_date);

          // Skip challan if it's in the same month as invoice start date
          if (
            invoice.payment_mode === "Prepaid" &&
            monthDiff(challanDate, invoiceStart) === 0
          ) {
            continue;
          }

          if (!shouldIncludeChallan(challan.order_sale_date, invoice.invoice_start_date)) continue;

          // Get ALL credit notes for this challan
          const challanCreditNotes = await CreditNote.findAll({
            where: {
              dispatch_order_id: challan.dispatch_order_id,
              transaction_type: {
            [Op.notIn]: ["Asset Swap", "Asset Removed"]
          }
            },
            include: [{
              model: CreditNoteItem,
              as: "items"
            }],
          });

          // NEW: Apply the same month separation logic to challan credit notes
          const allChallanCreditNotes = challanCreditNotes.map(note => note.toJSON());
          const {
            sameMonthCreditNotes: challanSameMonthNotes,
            differentMonthCreditNotes: challanDifferentMonthNotes
          } =
          separateCreditNotesByMonth(allChallanCreditNotes, invoice.invoice_start_date);

          // Collect returned devices from different-month credit notes
          let allReturnedForChallan = [];
          challanDifferentMonthNotes.forEach((note) => {
            if (note.transaction_type !== "Asset Swap" || note.transaction_type !== "Asset Removed") {
              note.items.forEach((ri) => {
                allReturnedForChallan.push(...parseJSONSafe(ri.device_ids));
              });
            }
          });

          const challanJSON = challan.toJSON();

          challanJSON.items.forEach((it) => {
            invoiceDeviceIds.push(...parseJSONSafe(it.device_ids));
          });

          // Show only same-month credit notes
          challanJSON.credit_notes = challanSameMonthNotes;

          // Subtract different-month credit notes from items
          challanJSON.items = challanJSON.items.map((item) => {
            const originalDeviceIds = parseJSONSafe(item.device_ids);
            invoiceDeviceIds.push(...originalDeviceIds);
            const updatedDeviceIds = filterRemainingDevices(
              originalDeviceIds,
              allReturnedForChallan,
              allSwappedDeviceIds
            );
            return {
              ...item,
              device_ids: updatedDeviceIds,
              quantity: updatedDeviceIds.length,
            };
          });

          challanJSON.times_created_in_invoice = await countDispatchOrderUpToCurrent(
            challan.dispatch_order_id,
            invoice.id
          );

          additionalDeliveryChallans.push(challanJSON);
        }
      }
    }


    // Fetch from DB
    let assetTransactions = await AssetTransaction.findAll({
      where: {
        customer_id: invoice.customer_id,
        parent_asset_id: {
          [Op.in]: invoiceDeviceIds
        }
      }
    });

    // Optionally filter for Prepaid/Postpaid months
    assetTransactions = assetTransactions.filter((txn) => {
      const actionDate = new Date(txn.action_date);
      const txnMonth = actionDate.getMonth();
      const txnYear = actionDate.getFullYear();
      const invoiceMonth = invoiceStart.getMonth();
      const invoiceYear = invoiceStart.getFullYear();

      
      return true;
    });


    // Main invoice items - apply the subtraction logic from first version
    const updatedItems = [];
    for (const item of invoice.items) {
      const device_ids = parseJSONSafe(item.device_ids);
      const returned_device_ids = parseJSONSafe(item.returned_device_ids);

      // NEW: Apply the subtraction logic from first version
      // Only subtract devices from different-month credit notes
      const remaining_device_ids =
        invoice.transaction_type === "Buy" ?
        device_ids :
        filterRemainingDevices(
          device_ids,
          [...returned_device_ids, ...allReturnedFromCreditNotes],
          allSwappedDeviceIds
        );

      const peripheralItems = await getPeripheralsForDevices(item.product_id, remaining_device_ids, invoiceStart);

      updatedItems.push({
        ...item.toJSON(),
        device_ids,
        returned_device_ids,
        remaining_device_ids,
        peripheralItems,
      });
    }

    // Peripherals for additional challans
    for (const challan of additionalDeliveryChallans) {
      for (const item of challan.items) {
        const device_ids = parseJSONSafe(item.device_ids);
        const peripheralItems = await getPeripheralsForDevices(item.product_id, device_ids, invoiceStart);
        item.peripheralItems = peripheralItems;
      }
    }

    // Final response
    const invoiceJSON = invoice.toJSON();
    invoiceJSON.items = updatedItems;
    invoiceJSON.order_table_id = order_table_id;
    invoiceJSON.order_date = order_date;
    // Show only same-month credit notes (from first version approach)
    invoiceJSON.credit_notes = filteredCreditNotes;
    invoiceJSON.asset_swaps = filteredAssetSwaps;
    invoiceJSON.additional_delivery_challans = additionalDeliveryChallans;
    invoiceJSON.rental_start_date = invoice.rental_start_date;
    invoiceJSON.rental_end_date = invoice.rental_end_date;
    invoiceJSON.times_created_in_invoice = mainDispatchOrderCount;
    invoiceJSON.asset_transactions = assetTransactions.map((t) => t.toJSON());
    return res.status(200).json(invoiceJSON);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};













export const getCustomerInvoices = async (req, res) => {
  try {
    const {
      customer_id
    } = req.params;

    // 1. Fetch all invoices for the customer with items and shipping details
    const invoices = await Invoice.findAll({
      where: {
        customer_id
      },
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
      order: [
        ['invoice_date', 'ASC']
      ], // Oldest first
    });

    if (!invoices || invoices.length === 0) {
      return res.status(404).json({
        message: 'No invoices found for this customer',
      });
    }

    // Helper function to parse device fields safely
    const parseJSONSafe = (input) => {
      try {
        if (typeof input === 'string') return JSON.parse(input);
        return Array.isArray(input) ? input : [];
      } catch {
        return [];
      }
    };

    // Process each invoice
    const processedInvoices = await Promise.all(invoices.map(async (invoice) => {
      // Fetch related order details
      const order = await Order.findByPk(invoice.order_id);

      // Fetch related credit notes
      const creditNotes = await CreditNote.findAll({
        where: {
          dispatch_order_id: invoice.dispatch_order_id
        },
        include: [{
          model: CreditNoteItem,
          as: 'items'
        }],
      });

      // Format invoice items
      const updatedItems = invoice.items.map((item) => {
        const device_ids = parseJSONSafe(item.device_ids);
        const returned_device_ids = parseJSONSafe(item.returned_device_ids);
        const remaining_device_ids = device_ids.filter(
          (id) => !returned_device_ids.includes(id)
        );

        return {
          ...item.toJSON(),
          device_ids,
          returned_device_ids,
          remaining_device_ids,
        };
      });

      // Build invoice object
      return {
        ...invoice.toJSON(),
        items: updatedItems,
        order_table_id: order?.order_id || null,
        order_date: order?.order_date || null,
        credit_notes: creditNotes.map(note => ({
          ...note.toJSON(),
          items: note.items || [],
        })),
      };
    }));

    // Group invoices by month for better organization
    const invoicesByMonth = processedInvoices.reduce((acc, invoice) => {
      const monthYear = invoice.invoice_date.substring(0, 7); // "2025-07" format
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      acc[monthYear].push(invoice);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      customer_id,
      invoice_count: processedInvoices.length,
      invoices_by_month: invoicesByMonth,
      all_invoices: processedInvoices, // Flat list of all invoices
    });

  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};


export const getCustomerInvoicesByDate = async (req, res) => {
  try {
    const {
      customer_id,
      invoice_date
    } = req.params;

    if (!customer_id || !invoice_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing customer_id or invoice_date'
      });
    }

    const inputDate = new Date(invoice_date);
    if (isNaN(inputDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice_date format'
      });
    }

    // Calculate last day of selected month
    const endOfMonth = new Date(inputDate.getFullYear(), inputDate.getMonth() + 1, 0, 23, 59, 59);

    // Fetch all invoices up to and including that date
    const invoices = await Invoice.findAll({
      where: {
        customer_id,
        invoice_date: {
          [Op.lte]: endOfMonth,
        },
      },
      include: [{
          model: InvoiceItem,
          as: 'items'
        },
        {
          model: InvoiceShippingDetail,
          as: 'shippingDetail'
        },
      ],
      order: [
        ['invoice_date', 'ASC']
      ],
    });

    // Remove duplicate invoices based on invoice_number
    const uniqueInvoicesMap = new Map();
    invoices.forEach(inv => {
      uniqueInvoicesMap.set(inv.invoice_number, inv);
    });
    const uniqueInvoices = Array.from(uniqueInvoicesMap.values());

    if (!uniqueInvoices.length) {
      return res.status(404).json({
        success: false,
        message: 'No invoices found for this customer',
      });
    }

    // Safe JSON parse utility
    const parseJSONSafe = (input) => {
      try {
        if (typeof input === 'string') return JSON.parse(input);
        return Array.isArray(input) ? input : [];
      } catch {
        return [];
      }
    };

    // Process each invoice
    const processedInvoices = await Promise.all(
      uniqueInvoices.map(async (invoice) => {
        const order = await Order.findByPk(invoice.order_id);

        const creditNotes = await CreditNote.findAll({
          where: {
            dispatch_order_id: invoice.dispatch_order_id
          },
          include: [{
            model: CreditNoteItem,
            as: 'items'
          }],
        });

        const updatedItems = invoice.items.map((item) => {
          const device_ids = parseJSONSafe(item.device_ids);
          const returned_device_ids = parseJSONSafe(item.returned_device_ids);
          const remaining_device_ids = device_ids.filter(
            (id) => !returned_device_ids.includes(id)
          );

          return {
            ...item.toJSON(),
            device_ids,
            returned_device_ids,
            remaining_device_ids,
          };
        });

        return {
          ...invoice.toJSON(),
          items: updatedItems,
          order_table_id: order?.order_id || null,
          order_date: order?.order_date || null,
          credit_notes: creditNotes.map((note) => ({
            ...note.toJSON(),
            items: note.items || [],
          })),
        };
      })
    );

    // Group by YYYY-MM
    const groupedInvoices = processedInvoices.reduce((acc, inv) => {
      const date = new Date(inv.invoice_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(inv);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      customer_id,
      requested_up_to_month: `${inputDate.getFullYear()}-${String(inputDate.getMonth() + 1).padStart(2, '0')}`,
      grouped_invoices: groupedInvoices,
    });
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};












// Update invoice with full functionality
export const updateInvoice = async (req, res) => {
  try {
    const {
      id
    } = req.params;

    // Find the existing invoice with proper associations
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
      success: false,
      message: "Invoice not found"
    });
    if (!req.body.items || !req.body.items.length) {
      return res.status(400).json({
        error: "At least one invoice item is required"
      });
    }

    const {
      order_id,
      invoice_number,
      invoice_title,
      transaction_type,
      dispatch_order_number,
      dispatch_order_id,
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

    const getCurrentTimestamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

    // Fetch DeliveryChallan for dc_date and dc_id
    let dc_date = null;
    let dc_id = null;
    if (dispatch_order_id) {
      const deliveryChallan = await DeliveryChallan.findOne({
        where: {
          dispatch_order_id
        }
      });
      if (deliveryChallan) {
        dc_date = formatDate(deliveryChallan.dc_date);
        dc_id = deliveryChallan.id;
      }
    }

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

    if (!formattedInvoiceStartDate || !formattedInvoiceEndDate) {
      return res.status(400).json({
        error: "Invalid invoice date range provided"
      });
    }

    // Tax rates
    const tax = await TaxType.findOne({
      where: {
        tax_type_name: {
          [Op.like]: '%GST%'
        }
      }
    });
    const taxRate = tax ? tax.percentage : 18;
    const cgstRate = taxRate / 2;
    const sgstRate = taxRate / 2;

    // Update invoice basic info
    await invoice.update({
      order_id,
      invoice_number,
      invoice_title,
      transaction_type,
      dc_id,
      dc_date,
      dispatch_order_number,
      dispatch_order_id,
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

    // Delete old invoice items
    await InvoiceItem.destroy({
      where: {
        invoice_id: invoice.id
      }
    });

    // Process new invoice items
    for (const item of items) {
      const product = await ProductTemplete.findByPk(item.product_id);
      if (!product) continue;

      const unitPrice = parseFloat(item.unit_price || 0);
      const totalPrice = parseFloat(item.total_price || 0);
      const cgst = parseFloat((totalPrice * cgstRate) / 100);
      const sgst = parseFloat((totalPrice * sgstRate) / 100);
      const totalTax = cgst + sgst;

      invoiceAmount += totalPrice;
      totalCGST += cgst;
      totalSGST += sgst;

      await InvoiceItem.create({
        invoice_id: invoice.id,
        order_id: item.order_id || null,
        product_id: item.product_id,
        product_name: item.product_name || product.product_name,
        previous_quantity: parseInt(item.previous_quantity || 0),
        quantity: parseInt(item.quantity || 0),
        unit_price: unitPrice.toFixed(2),
        total_price: totalPrice.toFixed(2),
        cgst: cgst.toFixed(2),
        sgst: sgst.toFixed(2),
        igst: "0.00",
        total_tax: totalTax.toFixed(2),
        total_amount: (totalPrice + totalTax).toFixed(2),
        rental_duration_months: parseInt(item.rental_duration_months || 0),
        rental_duration_days: parseInt(item.rental_duration_days || 0),
        new_quantity: parseInt(item.new_quantity || 0),
        return_quantity: parseInt(item.return_quantity || 0),
        device_ids: item.device_ids ? JSON.stringify(item.device_ids) : null,
        new_device_ids: item.new_device_ids || [],
        returned_device_ids: item.returned_device_ids || [],
        added_date: item.new_quantity && Number(item.new_quantity) !== 0 ? item.added_date ? formatDate(item.added_date) : getCurrentTimestamp() : null,
        returned_date: item.return_quantity && Number(item.return_quantity) !== 0 ? item.returned_date ? formatDate(item.returned_date) : getCurrentTimestamp() : null,
      });
    }

    const grandTotal = invoiceAmount + totalCGST + totalSGST;
    await invoice.update({
      amount: parseFloat(invoiceAmount.toFixed(2)),
      cgst: parseFloat(totalCGST.toFixed(2)),
      sgst: parseFloat(totalSGST.toFixed(2)),
      igst: 0,
      total_tax: parseFloat((totalCGST + totalSGST).toFixed(2)),
      total_amount: parseFloat(grandTotal.toFixed(2)),
    });

    // Update or create shipping details
    if (shippingDetails) {
      if (invoice.shippingDetail) {
        await invoice.shippingDetail.update({
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
        igst: 0
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