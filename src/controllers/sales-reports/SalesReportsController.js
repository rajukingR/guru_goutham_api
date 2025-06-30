import db from "../../models/index.js";
const {
  Lead,
  Quotation,
  Order,
  OrderItem,
  ProductTemplete,
} = db;

import { fn, col } from "sequelize";

export const getSalesReport = async (req, res) => {
  try {
    const leads = await Lead.findAll({
      where: { is_active: true },
      include: [
        {
          model: db.Contact,
          as: 'contact',
          required: false,
        },
        {
          model: db.LeadProduct,
          as: 'lead_products',
          required: false,
        },
        {
          model: Quotation,
          as: 'quotations',
          where: { status: 'Approved' },
          required: false,
          include: [
            {
              model: Order,
              as: 'orders',
              where: { order_status: 'Approved' },
              required: false,
              include: [
                {
                  model: OrderItem,
                  as: 'items',
                  required: false,
                  include: [
                    {
                      model: ProductTemplete,
                      as: 'product',
                      attributes: ['product_name', 'purchase_price', 'rent_price_per_month'],
                      required: false
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    res.status(200).json({ success: true, data: leads });
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error });
  }
};


export const getSalesAllLeads = async (req, res) => {
  try {
    const leadCounts = await Lead.findAll({
      attributes: [
        'source_of_enquiry',
        [fn('COUNT', col('id')), 'lead_count']
      ],
      group: ['source_of_enquiry'],
      order: [[fn('COUNT', col('id')), 'DESC']],
    });

    res.status(200).json(leadCounts);
  } catch (error) {
    console.error("Error fetching source_of_enquiry counts:", error);
    res.status(500).json({
      message: "Error fetching source_of_enquiry counts",
      error
    });
  }
};




export const getAllSalesOrdersReport = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: OrderItem,
          as: 'items', // This should match the alias used in your association
          attributes: ['requested_quantity', 'product_id'],
          include: [
            {
              model: ProductTemplete,
              as: 'product', // Ensure this alias matches the defined Sequelize relation
              attributes: ['rent_price_per_month']
            }
          ]
        }
      ]
    });

    const summary = {
      Approved: { totalOrders: 0, totalQuantity: 0, totalAmount: 0 },
      Rejected: { totalOrders: 0, totalQuantity: 0, totalAmount: 0 },
      Pending: { totalOrders: 0, totalQuantity: 0, totalAmount: 0 }
    };

    for (const order of orders) {
      const status = order.order_status || 'Pending';
      const statusKey = ['Approved', 'Rejected'].includes(status) ? status : 'Pending';

      summary[statusKey].totalOrders += 1;

      for (const item of order.items || []) {
        const qty = item.requested_quantity || 0;
        const price = item.product?.rent_price_per_month || 0;
        summary[statusKey].totalQuantity += qty;
        summary[statusKey].totalAmount += qty * price;
      }
    }

    res.json(summary);
  } catch (err) {
    console.error('Error fetching order status summary:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

