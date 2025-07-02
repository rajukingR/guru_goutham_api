import db from '../models/index.js';

const {
  Order,
  OrderItem,
  OrderAddress,
  OrderPersonalDetail,
  GoodsReceiptItem,
  GoodsReceipt,
  Product,
  ProductTemplete,
  DeliveryChallan,
  DeliveryChallanItem,
  Contact,

   Invoice,
  InvoiceItem,
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
      customer_id,
      transaction_type,
      payment_type,
      order_status,
      source_of_entry,
      owner,
      remarks,
      order_generated_by,
      rental_duration,
      rental_duration_days,
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
      customer_id,
      transaction_type,
      payment_type,
      order_status,
      source_of_entry,
      owner,
      remarks,
      order_generated_by,
      rental_duration,
      rental_duration_days,
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
      customer_id,
      source_of_entry,
      owner,
      remarks,
      order_generated_by,
      rental_duration,
      rental_duration_days,
      rental_start_date,
      rental_end_date,
      order_date,
      contact_status,
      personalDetails, // ✅ use camelCase key as per frontend
      address,
      items,
    } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        message: 'Order not found'
      });
    }

    // 👉 Validate stock if order is being Approved
    if (order_status === 'Approved') {
      const validation = await validateStockForApprovedOrder(items);
      if (validation.error) {
        return res.status(400).json({
          message: 'Some products have insufficient stock',
          errors: validation.errors,
        });
      }
    }

    // 👉 Update order fields
    await order.update({
      order_title,
      transaction_type,
      payment_type,
      order_status,
      source_of_entry,
      customer_id,
      owner,
      remarks,
      order_generated_by,
      rental_duration,
      rental_duration_days,
      rental_start_date,
      rental_end_date,
      order_date,
      contact_status,
      updated_at: new Date(),
    });

    // 👉 Update personal details (including GST number)
    if (personalDetails) {
      const personalDetail = await OrderPersonalDetail.findOne({
        where: {
          order_id: id
        },
      });

      if (personalDetail) {
        await personalDetail.update(personalDetails);
      } else {
        await OrderPersonalDetail.create({
          ...personalDetails,
          order_id: id,
        });
      }
    }

    // 👉 Update address
    if (address) {
      const orderAddress = await OrderAddress.findOne({
        where: {
          order_id: id
        },
      });

      if (orderAddress) {
        await orderAddress.update(address);
      } else {
        await OrderAddress.create({
          ...address,
          order_id: id,
        });
      }
    }

    // 👉 Replace order items
    if (items && Array.isArray(items)) {
      await OrderItem.destroy({
        where: {
          order_id: id
        }
      });

      const formattedItems = items.map((item) => ({
        ...item,
        order_id: id,
      }));

      await OrderItem.bulkCreate(formattedItems);
    }

    // ✅ Respond
    return res.status(200).json({
      message: 'Order updated successfully',
      order,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return res.status(500).json({
      message: 'Error updating order',
      error: error.message || 'Internal Server Error',
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
      where: { order_status: 'Approved' },
      include: [
        { model: OrderItem, as: 'items' },
        { model: OrderAddress, as: 'address' },
        { model: OrderPersonalDetail, as: 'personalDetails' },
        { model: Contact, as: 'customer' }
      ],
      order: [['id', 'DESC']]
    });

    // Step 1: Get only latest order per customer
    const latestOrdersMap = new Map();
    for (const order of orders) {
      const customerId = order.customer_id;
      if (customerId && !latestOrdersMap.has(customerId)) {
        latestOrdersMap.set(customerId, order);
      }
    }
    const latestOrders = Array.from(latestOrdersMap.values());

    const formattedOrders = await Promise.all(
      latestOrders.map(async (order) => {
        const orderJSON = order.toJSON();
        const { transaction_type, rental_duration } = orderJSON;

        let totalValue = 0;

        const itemsWithValue = await Promise.all(
          orderJSON.items.map(async (item) => {
            const product = await ProductTemplete.findOne({ where: { id: item.product_id } });

            let itemTotal = 0;
            const qty = item.requested_quantity || 0;
            const duration = parseInt(rental_duration);

            // Price calculation
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

            // Step 1: Get all received asset_ids for the product
            const grnItems = await GoodsReceiptItem.findAll({
              where: { product_id: item.product_id },
              attributes: ['asset_ids']
            });

            const allAssets = grnItems.flatMap(grn =>
              Array.isArray(grn.asset_ids) ? grn.asset_ids : []
            );
            const allAssetSet = new Set(allAssets);

            // Step 2: Get used device_ids from InvoiceItems for this order and product
            const usedInvoiceItems = await InvoiceItem.findAll({
              include: [{
                model: Invoice,
                as: 'invoice',
                where: { order_id: order.id },
                attributes: []
              }],
              where: { product_id: item.product_id },
              attributes: ['device_ids']
            });

            const usedSet = new Set();
            for (const ii of usedInvoiceItems) {
              try {
                const deviceIds = Array.isArray(ii.device_ids)
                  ? ii.device_ids
                  : JSON.parse(ii.device_ids || '[]');
                deviceIds.forEach(id => usedSet.add(id));
              } catch (err) {
                console.warn('Invalid device_ids JSON in InvoiceItem:', ii.device_ids);
              }
            }

            // Step 3: Get returned device_ids from InvoiceItems for this order and product
            const returnedInvoiceItems = await InvoiceItem.findAll({
              include: [{
                model: Invoice,
                as: 'invoice',
                where: { order_id: order.id },
                attributes: []
              }],
              where: { product_id: item.product_id },
              attributes: ['returned_device_ids']
            });

            const returnedSet = new Set();
            for (const ii of returnedInvoiceItems) {
              try {
                const returnedIds = Array.isArray(ii.returned_device_ids)
                  ? ii.returned_device_ids
                  : JSON.parse(ii.returned_device_ids || '[]');
                returnedIds.forEach(id => returnedSet.add(id));
              } catch (err) {
                console.warn('Invalid returned_device_ids JSON in InvoiceItem:', ii.returned_device_ids);
              }
            }

            // Step 4: Compute Available = (All - Used) + Returned
            const availableAssetSet = new Set(
              [...allAssetSet].filter(id => !usedSet.has(id) || returnedSet.has(id))
            );
            const availableAssetIds = Array.from(availableAssetSet);

            return {
              ...item,
              item_total_value: itemTotal,
              available_asset_ids: availableAssetIds
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
          personal_details: orderJSON.personalDetails,
          customer_details: order.customer,
          address: order.address,
          items: itemsWithValue
        };
      })
    );

    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error('Error in getAllOrdersApproved:', error);
    res.status(500).json({
      message: 'Error fetching approved orders with remaining asset info',
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
// Delete Order
export const deleteOrder = async (req, res) => {
  try {
    const {
      id
    } = req.params;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        message: 'Order not found'
      });
    }

    // STEP 1: Get all delivery_challans for this order
    const deliveryChallans = await DeliveryChallan.findAll({
      where: {
        order_id: id
      }
    });

    // STEP 2: Delete delivery_challan_items for each challan
    for (const challan of deliveryChallans) {
      await DeliveryChallanItem.destroy({
        where: {
          challan_id: challan.id
        }
      });
    }

    // STEP 3: Delete delivery_challans
    await DeliveryChallan.destroy({
      where: {
        order_id: id
      }
    });

    // STEP 4: Delete related order data
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

    // STEP 5: Finally delete the order
    await order.destroy();

    res.status(200).json({
      message: 'Order and all related data deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error deleting order and related data',
      error
    });
  }
};