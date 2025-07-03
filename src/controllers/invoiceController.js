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
const AssetModificationTracker = db.AssetModificationTracker;


export const createInvoice = async (req, res) => {
  try {
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
      dc_id,
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

    // Helper functions
    const normalizeInt = (val) => val === '' ? null : val;
    const getCurrentTimestamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

    const formatDate = (input) => {
      if (!input) return null;
      const date = new Date(input);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    };

    // Format dates
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

    // Validate dates
    if (!formattedInvoiceStartDate || !formattedInvoiceEndDate) {
      return res.status(400).json({ error: "Invalid invoice date range provided" });
    }

    const startDate = new Date(formattedInvoiceStartDate);
    const endDate = new Date(formattedInvoiceEndDate);
    const totalInvoiceDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    if (totalInvoiceDays <= 0) {
      return res.status(400).json({ error: "Invoice end date must be after start date" });
    }

    // Get tax rates
    const tax = await TaxType.findOne({
      where: { tax_type_name: { [Op.like]: '%GST%' } },
    });
    const taxRate = tax ? tax.percentage : 18;
    const cgstRate = taxRate / 2;
    const sgstRate = taxRate / 2;

    // Create invoice
    const invoice = await Invoice.create({
      order_id: normalizeInt(order_id),
      invoice_number,
      invoice_title,
      dc_id,
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
      created_at: getCurrentTimestamp(),
    });

    // Process invoice items
    let invoiceAmount = 0;
    let totalCGST = 0;
    let totalSGST = 0;

    for (const item of items) {
      const product = await ProductTemplete.findByPk(item.product_id);
      if (!product) continue;

      const rentPerMonth = parseFloat(product.rent_price_per_month || 0);
      const dailyRate = rentPerMonth / 30;

      const prevQty = parseInt(item.previous_quantity || 0);
      const newQty = parseInt(item.new_quantity || 0);
      const returnQty = parseInt(item.return_quantity || 0);
      const months = parseInt(item.rental_duration_months || 0);
      const days = parseInt(item.rental_duration_days || 0);

      // Calculate pricing
      let total_price = 0;
      if (prevQty > 0) {
        total_price += rentPerMonth * prevQty * months;
        total_price += dailyRate * prevQty * days;
      }
      if (newQty > 0) {
        const addedDate = item.added_date ? new Date(formatDate(item.added_date)) : startDate;
        const effectiveDays = Math.ceil((endDate - addedDate) / (1000 * 60 * 60 * 24)) + 1;
        total_price += dailyRate * newQty * Math.max(0, effectiveDays);
      }
      if (returnQty > 0) {
        const returnedDate = item.returned_date ? new Date(formatDate(item.returned_date)) : endDate;
        const usedDays = Math.ceil((returnedDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        total_price += dailyRate * returnQty * Math.min(usedDays, totalInvoiceDays);
      }

      const cgst = parseFloat((total_price * cgstRate) / 100);
      const sgst = parseFloat((total_price * sgstRate) / 100);
      const total_tax = cgst + sgst;
      const total_amount = total_price + total_tax;

      invoiceAmount += total_price;
      totalCGST += cgst;
      totalSGST += sgst;

      // Create invoice item
      const invoiceItem = await InvoiceItem.create({
        invoice_id: invoice.id,
        order_id,
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
        device_ids: Array.isArray(item.device_ids) ? JSON.stringify(item.device_ids) : item.device_ids,
        new_device_ids: Array.isArray(item.new_device_ids) ? JSON.stringify(item.new_device_ids) : item.new_device_ids,
        returned_device_ids: Array.isArray(item.returned_device_ids) ? JSON.stringify(item.returned_device_ids) : item.returned_device_ids,
        added_date: newQty ? formatDate(item.added_date) || getCurrentTimestamp() : null,
        returned_date: returnQty ? formatDate(item.returned_date) || getCurrentTimestamp() : null,
      });

      // Process each device in device_ids
      for (const deviceId of item.device_ids || []) {
        const existingAsset = await AssetId.findOne({ where: { asset_id: deviceId } });

        if (existingAsset) {
          // Update existing asset with latest product specs
          await existingAsset.update({
            invoice_id: invoice.id,
            product_id: product.id,
            product_name: product.product_name,
            ram: product.ram,
            storage: product.storage,
            processor: product.processor,
            os: product.os,
            graphics: product.graphics,
            disk_type: product.disk_type,
            brand: product.brand,
            model: product.model,
            grade: product.grade,
            screen_size: product.screen_size,
            resolution: product.resolution,
            brightness: product.brightness,
            power_consumption: product.power_consumption,
            display_device: product.display_device,
            audio_output: product.audio_output,
            weight: product.weight,
            color: product.color,
            updated_at: new Date()
          });
        } else {
          // Create new asset record with product specs
          await AssetId.create({
            invoice_id: invoice.id,
            product_id: product.id,
            asset_id: deviceId,
            product_name: product.product_name,
            ram: product.ram,
            storage: product.storage,
            processor: product.processor,
            os: product.os,
            graphics: product.graphics,
            disk_type: product.disk_type,
            brand: product.brand,
            model: product.model,
            grade: product.grade,
            screen_size: product.screen_size,
            resolution: product.resolution,
            brightness: product.brightness,
            power_consumption: product.power_consumption,
            display_device: product.display_device,
            audio_output: product.audio_output,
            weight: product.weight,
            color: product.color,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    }

    // Update invoice totals
    const grandTotal = invoiceAmount + totalCGST + totalSGST;
    await invoice.update({
      amount: parseFloat(invoiceAmount.toFixed(2)),
      cgst: parseFloat(totalCGST.toFixed(2)),
      sgst: parseFloat(totalSGST.toFixed(2)),
      igst: 0,
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
      asset_count: items.reduce((sum, item) => sum + (item.device_ids?.length || 0), 0)
    });

  } catch (error) {
    console.error("Error creating invoice:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create invoice",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};;



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


export const getAllApprovedInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      where: {
        approval_status: 'Approved'
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
          item.returned_device_ids :
          [];

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



export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch invoice with items and shipping details
    const invoice = await Invoice.findByPk(id, {
      include: [
        {
          model: InvoiceItem,
          as: 'items',
          include: [
            {
              model: ProductTemplete,
              as: 'productDetails',
            },
          ],
        },
        {
          model: InvoiceShippingDetail,
          as: 'shippingDetail',
        },
      ],
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // 2. Fetch order using invoice.order_id (FK to Order.id)
    const order = await Order.findByPk(invoice.order_id);

    const order_date = order?.order_date || null;
    const order_table_id = order?.order_id || null;

    // 3. Helper to parse device ID fields
    const parseJSONSafe = (input) => {
      try {
        if (typeof input === 'string') return JSON.parse(input);
        return Array.isArray(input) ? input : [];
      } catch {
        return [];
      }
    };

    // 4. Process invoice items and enrich with asset_modification data
    const updatedItems = [];

    for (const item of invoice.items) {
      const device_ids = parseJSONSafe(item.device_ids);
      const returned_device_ids = parseJSONSafe(item.returned_device_ids);
      const remaining_device_ids = device_ids.filter(
        (id) => !returned_device_ids.includes(id)
      );

      const enrichedAssets = [];

      for (const asset_id of remaining_device_ids) {
        const modification = await AssetModificationTracker.findOne({
          where: {
            invoice_id: invoice.id,
            asset_id: asset_id,
            [Op.or]: [
              { new_ram: { [Op.ne]: null } },
              { new_ram_cost: { [Op.ne]: null } },
              { new_storage: { [Op.ne]: null } },
              { new_storage_cost: { [Op.ne]: null } },
              {approval_date: { [Op.ne]: null},}
            ],
          },
          attributes: [
            'asset_id',
            'ram',
            'new_ram',
            'new_ram_cost',
            'storage',
            'new_storage',
            'new_storage_cost',
            'approval_date',
          ],
        });

        if (modification) {
          enrichedAssets.push(modification);
        }
      }

      updatedItems.push({
        ...item.toJSON(),
        device_ids,
        returned_device_ids,
        remaining_device_ids,
        asset_modifications: enrichedAssets,
      });
    }

    // Final invoice response
    const invoiceJSON = invoice.toJSON();
    invoiceJSON.items = updatedItems;
    invoiceJSON.order_table_id = order_table_id;
    invoiceJSON.order_date = order_date;
    invoiceJSON.rental_start_date = invoice.rental_start_date;
    invoiceJSON.rental_end_date = invoice.rental_end_date;

    return res.status(200).json(invoiceJSON);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};








// Update invoice with full functionality
export const updateInvoice = async (req, res) => {
  try {
    const {
      id
    } = req.params;

    // Find the existing invoice with proper association aliases
    const invoice = await Invoice.findByPk(id, {
      include: [{
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
      dc_id,
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
      dc_id,
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
      where: {
        invoice_id: invoice.id
      }
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
        order_id: item.order_id || null, // ✅ Include per-item order ID

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
        device_ids: item.device_ids ? JSON.stringify(item.device_ids) : null,

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