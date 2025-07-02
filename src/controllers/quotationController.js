import db from '../models/index.js';
const Quotation = db.Quotation;
const QuotationItem = db.QuotationItem;
const Product = db.Product;
const Lead = db.Lead;
const GoodsReceiptItem = db.GoodsReceiptItem;
const Order =  db.Order;
const OrderItem =  db.OrderItem;
const Contact = db.Contact;

export const createQuotation = async (req, res) => {
  try {
    const {
      quotation_id,
      quotation_title,
      lead_id,
      // rental_start_date,
      // rental_end_date,
      quotation_date,
      rental_duration,
      rental_duration_days,
      remarks,
      quotation_generated_by,
      status,
      customer_id,
      customer_first_name,
      customer_last_name,
      items
    } = req.body;

    const quotation = await Quotation.create({
      quotation_id,
      quotation_title,
      lead_id,
      // rental_start_date,
      // rental_end_date,
      quotation_date,
      rental_duration,
      rental_duration_days,
      remarks,
      quotation_generated_by,
      status,
      customer_id,
      customer_first_name,
      customer_last_name
    });

    if (items && Array.isArray(items)) {
      const itemsWithProductNames = await Promise.all(
        items.map(async (item) => {
          const product = await Product.findByPk(item.product_id);
          return {
            ...item,
            quotation_id: quotation.id,
            product_name: product ? product.name : null
          };
        })
      );

      await QuotationItem.bulkCreate(itemsWithProductNames);
    }

    res.status(201).json({
      message: 'Quotation created successfully',
      quotation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error creating quotation',
      error
    });
  }
};
;


// Get all quotations
export const getAllQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.findAll({
      include: [{
        model: QuotationItem,
        as: 'items', // use the same alias as defined in the model
      }]
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
      where: { status: 'Approved' },
      include: [
        {
          model: QuotationItem,
          as: 'items',
          include: [
            {
              model: db.GoodsReceiptItem,
              as: 'goodsReceiptItems',
              attributes: ['id', 'goods_receipt_id', 'product_id', 'asset_ids'],
            },
          ],
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
    });

    const approvedOrders = await Order.findAll({
      where: { order_status: 'Approved' },
      include: [
        {
          model: OrderItem,
          as: 'items',
          attributes: ['product_id', 'device_ids'],
        },
      ],
    });

    const usedDeviceMap = {};

    approvedOrders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product_id;
        let deviceIds = [];

        try {
          deviceIds = Array.isArray(item.device_ids)
            ? item.device_ids
            : JSON.parse(item.device_ids || '[]');
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
      }]
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
      // rental_start_date,
      // rental_end_date,
      quotation_date,
      rental_duration,
      rental_duration_days,
      remarks,
      quotation_generated_by,
      status,
      customer_id,
      customer_first_name,
      customer_last_name
    } = req.body;

    const quotation = await Quotation.findByPk(id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    await quotation.update({
      quotation_title,
      // rental_start_date,
      // rental_end_date,
      quotation_date,
      rental_duration,
      rental_duration_days,
      remarks,
      quotation_generated_by,
      status,
      customer_id,
      customer_first_name,
      customer_last_name,
      updated_at: new Date()
    });

    res.status(200).json({
      message: 'Quotation updated successfully',
      quotation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error updating quotation',
      error
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