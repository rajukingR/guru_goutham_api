import db from '../models/index.js';
const Quotation = db.Quotation;
const QuotationItem = db.QuotationItem;
const Product = db.Product;
const Lead = db.Lead;
const GoodsReceiptItem = db.GoodsReceiptItem;
const Order = db.Order;
const OrderItem = db.OrderItem;
const Contact = db.Contact;

export const createQuotation = async (req, res) => {
  try {
    const {
      quotation_id,
      quotation_title,
      lead_id,
      quotation_date,
      rental_duration,
      rental_duration_days,
      transaction_type,
      payment_type,
      remarks,
      quotation_generated_by,
      status,
      customer_id,
      customer_first_name,
      customer_last_name,
      items
    } = req.body;

    // Create main quotation
    const quotation = await Quotation.create({
      quotation_id,
      quotation_title,
      lead_id,
      quotation_date,
      rental_duration,
      rental_duration_days,
      transaction_type,
      payment_type,
      remarks,
      quotation_generated_by,
      status,
      customer_id,
      customer_first_name,
      customer_last_name,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Create quotation items with pricing fields
    if (items && Array.isArray(items)) {
      const itemsWithProductNames = await Promise.all(
        items.map(async (item) => {
          const product = await Product.findByPk(item.product_id);

          return {
            quotation_id: quotation.id,
            product_id: item.product_id,
            product_name: product ? product.product_name : null, // assuming column is product_name
            requested_quantity: item.requested_quantity,
            quotation_quantity: item.quotation_quantity,
            purchase_price: item.purchase_price || 0,
            offer_purchase_price: item.offer_purchase_price || 0,
            rent_price_per_month: item.rent_price_per_month || 0,
            offer_rent_price_per_month: item.offer_rent_price_per_month || 0,
            created_at: new Date(),
            updated_at: new Date()
          };
        })
      );

      await QuotationItem.bulkCreate(itemsWithProductNames);
    }

    res.status(201).json({
      message: "Quotation created successfully",
      quotation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error creating quotation",
      error: error.message
    });
  }
};



// Get all quotations
export const getAllQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.findAll({
      include: [
        {
          model: QuotationItem,
          as: 'items', // use the same alias as defined in the model
        }
      ],
      order: [['created_at', 'DESC']] // <-- Sort by created_at descending
    });

    res.status(200).json(quotations);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching quotations',
      error
    });
  }
};



export const getAllQuotationsApproved = async (req, res) => {
  try {
    const quotations = await Quotation.findAll({
      where: {
        status: 'Approved'
      },
      include: [{
          model: QuotationItem,
          as: 'items',
          include: [{
            model: db.GoodsReceiptItem,
            as: 'goodsReceiptItems',
            attributes: ['id', 'goods_receipt_id', 'product_id', 'asset_ids'],
          }, ],
        },
        {
          model: Contact,
          as: 'customer', // This alias must match the one in the association
          attributes: [
            'id',
            'first_name',
            'last_name',
            'email',
            'phone_number',
            'company_name',
            'customer_id',
            'industry',
            'payment_type',
            'gst',
            'pan_no',
            'owner',
            'remarks',
            'status',
            'created_at',
            'updated_at',
            'address'
          ],
        },
      ],
                  order: [['id', 'DESC']] // <-- Sort leads by created_at descending

    });

    const approvedOrders = await Order.findAll({
      where: {
        order_status: 'Approved'
      },
      include: [{
        model: OrderItem,
        as: 'items',
        attributes: ['product_id', 'device_ids'],
      }, ],
    });

    const usedDeviceMap = {};

    approvedOrders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product_id;
        let deviceIds = [];

        try {
          deviceIds = Array.isArray(item.device_ids) ?
            item.device_ids :
            JSON.parse(item.device_ids || '[]');
        } catch (err) {
          console.warn('Invalid device_ids JSON:', item.device_ids);
        }

        if (!usedDeviceMap[productId]) {
          usedDeviceMap[productId] = new Set();
        }

        deviceIds.forEach(id => usedDeviceMap[productId].add(id));
      });
    });

    quotations.forEach(q => {
      q.items.forEach(item => {
        const allAssets = [];

        item.goodsReceiptItems?.forEach(grn => {
          if (Array.isArray(grn.asset_ids)) {
            allAssets.push(...grn.asset_ids);
          }
        });

        const usedSet = usedDeviceMap[item.product_id] || new Set();
        const remainingAssets = allAssets.filter(asset => !usedSet.has(asset));
        item.setDataValue('available_asset_ids', remainingAssets);
      });
    });

    res.status(200).json(quotations);
  } catch (error) {
    console.error('Error fetching approved quotations with remaining assets:', error);
    res.status(500).json({
      message: 'Error fetching approved quotations with remaining assets',
      error,
    });
  }
};







// Get quotation by ID
export const getQuotationById = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const quotation = await Quotation.findByPk(id, {
      include: [{
        model: QuotationItem,
        as: 'items', // use the same alias as defined in the model
      },
      {
          model: Contact,
          as: 'customer', // This alias must match the one in the association
          attributes: [
            'id',
            'first_name',
            'last_name',
            'email',
            'phone_number',
            'company_name',
            'customer_id',
            'industry',
            'payment_type',
            'gst',
            'pan_no',
            'owner',
            'remarks',
            'status',
            'created_at',
            'updated_at',
            'address'
          ],
        },
    
    ]
    });

    if (!quotation) return res.status(404).json({
      message: 'Quotation not found'
    });

    res.status(200).json(quotation);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching quotation',
      error
    });
  }
};

// Update quotation
export const updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      quotation_title,
      quotation_date,
      rental_duration,
      rental_duration_days,
      transaction_type,
      payment_type,
      remarks,
      quotation_generated_by,
      status,
      customer_id,
      customer_first_name,
      customer_last_name,
      items, // includes price fields too
      lead_id
    } = req.body;

    const quotation = await Quotation.findByPk(id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    // Update quotation
    await quotation.update({
      quotation_title,
      quotation_date,
      rental_duration,
      rental_duration_days,
      transaction_type,
      payment_type,
      remarks,
      quotation_generated_by,
      status,
      customer_id,
      customer_first_name,
      customer_last_name,
      lead_id,
      updated_at: new Date(),
    });

    // Handle items update
    if (items && items.length > 0) {
      // Remove old items
      await QuotationItem.destroy({ where: { quotation_id: id } });

      // Insert new items with new columns
      const quotationItems = items.map((item) => ({
        quotation_id: id,
        product_id: item.product_id,
        product_name: item.product_name,
        requested_quantity: item.requested_quantity,
        quotation_quantity: item.quotation_quantity,
        purchase_price: item.purchase_price || 0,
        offer_purchase_price: item.offer_purchase_price || 0,
        rent_price_per_month: item.rent_price_per_month || 0,
        offer_rent_price_per_month: item.offer_rent_price_per_month || 0,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      await QuotationItem.bulkCreate(quotationItems);
    }

    res.status(200).json({
      message: "Quotation updated successfully",
      quotation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error updating quotation",
      error: error.message,
    });
  }
};



// Delete quotation
export const deleteQuotation = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const quotation = await Quotation.findByPk(id);

    if (!quotation) return res.status(404).json({
      message: 'Quotation not found'
    });

    await QuotationItem.destroy({
      where: {
        quotation_id: id
      }
    }); // delete items first
    await quotation.destroy();

    res.status(200).json({
      message: 'Quotation deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error deleting quotation',
      error
    });
  }
};