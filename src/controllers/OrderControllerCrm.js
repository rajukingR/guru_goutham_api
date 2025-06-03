import db from '../models/index.js';
const {
  Order,
  OrderItem,
  OrderAddress,
  OrderPersonalDetail,
  GoodsReceipt,
  GoodsReceiptItem,
  Product,
  ProductTemplete
} = db;

// ✅ Helper: Validate stock from approved goods receipts
const validateStockForApprovedOrder = async (items = []) => {
  const approvedReceipts = await GoodsReceipt.findAll({
    where: {
      goods_receipt_status: 'Approved'
    },
    attributes: ['id'],
  });

  const approvedReceiptIds = approvedReceipts.map(r => r.id);

  if (!approvedReceiptIds.length) {
    return {
      error: true,
      errors: [{
        message: "No approved goods receipts available"
      }]
    };
  }

  const receiptItems = await GoodsReceiptItem.findAll({
    where: {
      goods_receipt_id: approvedReceiptIds
    },
    attributes: ['product_id', 'quantity'],
  });

  const stockMap = {};
  receiptItems.forEach(item => {
    stockMap[item.product_id] = (stockMap[item.product_id] || 0) + item.quantity;
  });

  const errors = [];

  for (const item of items) {
    const availableQty = stockMap[item.product_id] || 0;
    const requestedQty = item.requested_quantity || 0;

    if (requestedQty > availableQty) {
      const product = await Product.findByPk(item.product_id);
      const productName = product?.name || 'Unknown';

      errors.push({
        product_id: item.product_id,
        product_name: productName,
        available_quantity: availableQty,
        requested_quantity: requestedQty,
        message: `Insufficient stock for ${productName}. Available QTY: ${availableQty}, Requested QTY: ${requestedQty}.`
      });
    }
  }


  return errors.length ? {
    error: true,
    errors
  } : {
    error: false
  };
};

// ✅ Create Order
export const createOrder = async (req, res) => {
  try {
    const {
      order_id,
      order_title,
      quotation_id,
      transaction_type,
      payment_type,
      order_status,
      source_of_entry,
      owner,
      remarks,
      order_generated_by,
      rental_duration,
      rental_start_date,
      rental_end_date,
      order_date,
      contact_status,
      personal_details,
      address,
      items
    } = req.body;

    // 👉 Validate stock if order is being Approved
    if (order_status === 'Approved') {
      const validation = await validateStockForApprovedOrder(items);
      if (validation.error) {
        return res.status(400).json({
          message: 'Some products have insufficient stock',
          errors: validation.errors
        });
      }
    }

    // 👉 Create the order
    const order = await Order.create({
      order_id,
      order_title,
      quotation_id,
      transaction_type,
      payment_type,
      order_status,
      source_of_entry,
      owner,
      remarks,
      order_generated_by,
      rental_duration,
      rental_start_date,
      rental_end_date,
      order_date,
      contact_status
    });

    // 👉 Create personal details if provided
    if (personal_details) {
      await OrderPersonalDetail.create({
        ...personal_details,
        order_id: order.id
      });
    }

    // 👉 Create address if provided
    if (address) {
      await OrderAddress.create({
        ...address,
        order_id: order.id
      });
    }

    // 👉 Create order items if provided
    if (items && Array.isArray(items)) {
      const formattedItems = items.map(item => ({
        ...item,
        order_id: order.id
      }));
      await OrderItem.bulkCreate(formattedItems);
    }

    // ✅ Success response
    return res.status(201).json({
      message: 'Order created successfully',
      order
    });

  } catch (error) {
    // 🔥 Professional error logging
    console.error('Error creating order:', error);

    // ❌ Return detailed error message
    return res.status(500).json({
      message: 'Error creating order',
      error: error.message || 'Internal server error'
    });
  }
};


// ✅ Update Order
export const updateOrder = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const {
      order_title,
      transaction_type,
      payment_type,
      order_status,
      source_of_entry,
      owner,
      remarks,
      order_generated_by,
      rental_duration,
      rental_start_date,
      rental_end_date,
      order_date,
      contact_status,
      personal_details,
      address,
      items
    } = req.body;

    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({
      message: 'Order not found'
    });

    // 👉 Validate stock if order is being Approved
    if (order_status === 'Approved') {
      const validation = await validateStockForApprovedOrder(items);
      if (validation.error) {
        return res.status(400).json({
          message: 'Some products have insufficient stock',
          errors: validation.errors
        });
      }
    }

    await order.update({
      order_title,
      transaction_type,
      payment_type,
      order_status,
      source_of_entry,
      owner,
      remarks,
      order_generated_by,
      rental_duration,
      rental_start_date,
      rental_end_date,
      order_date,
      contact_status,
      updated_at: new Date()
    });

    // Update personal details
    if (personal_details) {
      const personalDetail = await OrderPersonalDetail.findOne({
        where: {
          order_id: id
        }
      });
      if (personalDetail) {
        await personalDetail.update(personal_details);
      } else {
        await OrderPersonalDetail.create({
          ...personal_details,
          order_id: id
        });
      }
    }

    // Update address
    if (address) {
      const orderAddress = await OrderAddress.findOne({
        where: {
          order_id: id
        }
      });
      if (orderAddress) {
        await orderAddress.update(address);
      } else {
        await OrderAddress.create({
          ...address,
          order_id: id
        });
      }
    }

    // Replace order items
    if (items && Array.isArray(items)) {
      await OrderItem.destroy({
        where: {
          order_id: id
        }
      });
      const formattedItems = items.map(item => ({
        ...item,
        order_id: id
      }));
      await OrderItem.bulkCreate(formattedItems);
    }

    res.status(200).json({
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error updating order',
      error
    });
  }
};

// Get All Orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [{
          model: OrderItem,
          as: 'items'
        },
        {
          model: OrderAddress,
          as: 'address'
        },
        {
          model: OrderPersonalDetail,
          as: 'personalDetails'
        }
      ]
    });

    const formattedOrders = await Promise.all(
      orders.map(async (order) => {
        const orderJSON = order.toJSON();
        const {
          transaction_type,
          rental_duration
        } = orderJSON;

        let totalValue = 0;

        // Calculate each item value
        const itemsWithValue = await Promise.all(
          orderJSON.items.map(async (item) => {
            const product = await ProductTemplete.findOne({
              where: {
                id: item.product_id
              }
            });

            let itemTotal = 0;
            const qty = item.requested_quantity || 0;
            const duration = parseInt(rental_duration); // Make sure it's a number

            if (product) {
              if (transaction_type === 'Rent') {
                if (duration >= 12 && product.rent_price_1_year) {
                  // Annual rent per item is for 12 months
                  itemTotal = qty * (product.rent_price_1_year);
                } else if (duration >= 6 && product.rent_price_6_months) {
                  itemTotal = qty * (duration / 6) * product.rent_price_6_months;
                } else if (duration >= 1 && product.rent_price_per_month) {
                  itemTotal = qty * duration * product.rent_price_per_month;
                } else if (duration < 1 && product.rent_price_per_day) {
                  itemTotal = qty * (duration * 30) * product.rent_price_per_day;
                }
              } else if (transaction_type === 'Buy') {
                itemTotal = qty * product.purchase_price;
              }
            }

            totalValue += itemTotal;

            return {
              ...item,
              item_total_value: itemTotal
            };
          })
        );

        const totalQuantity = orderJSON.items.reduce(
          (sum, item) => sum + (item.requested_quantity || 0),
          0
        );

        return {
          ...orderJSON,
          total_quantity: totalQuantity,
          total_order_value: totalValue,
          personal_details: order.personalDetails,
          address: order.address,
          items: itemsWithValue
        };
      })
    );

    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching orders',
      error
    });
  }
};


export const getAllOrdersApproved = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: {
        order_status: 'Approved'
      }, // ✅ Filter approved orders
      include: [{
          model: OrderItem,
          as: 'items'
        },
        {
          model: OrderAddress,
          as: 'address'
        },
        {
          model: OrderPersonalDetail,
          as: 'personalDetails'
        }
      ]
    });

    const formattedOrders = await Promise.all(
      orders.map(async (order) => {
        const orderJSON = order.toJSON();
        const {
          transaction_type,
          rental_duration
        } = orderJSON;

        let totalValue = 0;

        // Calculate each item value
        const itemsWithValue = await Promise.all(
          orderJSON.items.map(async (item) => {
            const product = await ProductTemplete.findOne({
              where: {
                id: item.product_id
              }
            });

            let itemTotal = 0;
            const qty = item.requested_quantity || 0;
            const duration = parseInt(rental_duration);

            if (product) {
              if (transaction_type === 'Rent') {
                if (duration >= 12 && product.rent_price_1_year) {
                  itemTotal = qty * product.rent_price_1_year;
                } else if (duration >= 6 && product.rent_price_6_months) {
                  itemTotal = qty * (duration / 6) * product.rent_price_6_months;
                } else if (duration >= 1 && product.rent_price_per_month) {
                  itemTotal = qty * duration * product.rent_price_per_month;
                } else if (duration < 1 && product.rent_price_per_day) {
                  itemTotal = qty * (duration * 30) * product.rent_price_per_day;
                }
              } else if (transaction_type === 'Buy') {
                itemTotal = qty * product.purchase_price;
              }
            }

            totalValue += itemTotal;

            return {
              ...item,
              item_total_value: itemTotal
            };
          })
        );

        const totalQuantity = orderJSON.items.reduce(
          (sum, item) => sum + (item.requested_quantity || 0),
          0
        );

        return {
          ...orderJSON,
          total_quantity: totalQuantity,
          total_order_value: totalValue,
          personal_details: order.personalDetails,
          address: order.address,
          items: itemsWithValue
        };
      })
    );

    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching approved orders',
      error
    });
  }
};



// Get Order by ID
export const getOrderById = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const order = await Order.findByPk(id, {
      include: [{
          model: OrderItem,
          as: 'items'
        },
        {
          model: OrderAddress,
          as: 'address'
        },
        {
          model: OrderPersonalDetail,
          as: 'personalDetails'
        }
      ]
    });

    if (!order) return res.status(404).json({
      message: 'Order not found'
    });

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching order',
      error
    });
  }
};



// Delete Order
export const deleteOrder = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({
      message: 'Order not found'
    });

    await OrderItem.destroy({
      where: {
        order_id: id
      }
    });
    await OrderAddress.destroy({
      where: {
        order_id: id
      }
    });
    await OrderPersonalDetail.destroy({
      where: {
        order_id: id
      }
    });
    await order.destroy();

    res.status(200).json({
      message: 'Order and related data deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error deleting order',
      error
    });
  }
};