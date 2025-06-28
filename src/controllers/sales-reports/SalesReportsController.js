import db from "../../models/index.js";

const {
  Lead,
  Quotation,
  Order,
  OrderItem,
  ProductTemplete,
} = db;

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
                      as: 'product', // must match association alias
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

