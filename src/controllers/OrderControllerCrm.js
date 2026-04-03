import db from '../models/index.js';
import { Op } from "sequelize";

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
  DispatchOrder,
  Invoice,
  DispatchOrderItem,
  InvoiceItem,
  CreditNoteItem,
  AssembledAsset,
  AssembledComponent,
} = db;


///UPDATED 05-08-25



// const validateStockForApprovedOrder = async (items = []) => {
//   const approvedReceipts = await GoodsReceipt.findAll({
//     where: {
//       goods_receipt_status: 'Approved'
//     },
//     attributes: ['id'],
//   });

//   const approvedReceiptIds = approvedReceipts.map(r => r.id);

//   if (!approvedReceiptIds.length) {
//     return {
//       error: true,
//       errors: [{
//         message: "No approved goods receipts available"
//       }]
//     };
//   }

//   const receiptItems = await GoodsReceiptItem.findAll({
//     where: {
//       goods_receipt_id: approvedReceiptIds
//     },
//     attributes: ['product_id', 'quantity'],
//   });

//   const stockMap = {};
//   receiptItems.forEach(item => {
//     stockMap[item.product_id] = (stockMap[item.product_id] || 0) + item.quantity;
//   });

//   const errors = [];

//   for (const item of items) {
//     const availableQty = stockMap[item.product_id] || 0;
//     const requestedQty = item.requested_quantity || 0;

//     if (requestedQty > availableQty) {
//       const product = await Product.findByPk(item.product_id);
//       const productName = product?.name || 'Unknown';

//       errors.push({
//         product_id: item.product_id,
//         product_name: productName,
//         available_quantity: availableQty,
//         requested_quantity: requestedQty,
//         message: `Insufficient stock for ${productName}. Available QTY: ${availableQty}, Requested QTY: ${requestedQty}.`
//       });
//     }
//   }


//   return errors.length ? {
//     error: true,
//     errors
//   } : {
//     error: false
//   };
// };

const validateStockForApprovedOrder = async (items = []) => {
  // Get all approved goods receipts
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

  // Get all receipt items from approved receipts
  const receiptItems = await GoodsReceiptItem.findAll({
    where: {
      goods_receipt_id: approvedReceiptIds
    },
    attributes: ['product_id', 'quantity'],
  });

  // Build stock map for regular products
  const stockMap = {};
  receiptItems.forEach(item => {
    stockMap[item.product_id] = (stockMap[item.product_id] || 0) + item.quantity;
  });

  const errors = [];

  for (const item of items) {
    // Fetch product details
    const productTemplete = await ProductTemplete.findOne({
      where: {
        id: item.product_id
      },
      attributes: ['id', 'product_category', 'assembled_id']
    });

    // Handle Assembled PC products
    if (productTemplete?.product_category === "Assembled PC" && productTemplete?.assembled_id) {
      // Get all components for this assembled PC
      const components = await AssembledComponent.findAll({
        where: {
          assembled_id: productTemplete.assembled_id
        },
        attributes: ['product_id', 'component_type']
      });

      // Check stock for each component
      let hasInsufficientStock = false;
      let insufficientComponents = [];

      for (const component of components) {
        if (component.product_id) {
          const availableQty = stockMap[component.product_id] || 0;
          const requestedQty = item.requested_quantity || 0;

          if (requestedQty > availableQty) {
            hasInsufficientStock = true;
            insufficientComponents.push({
              component_type: component.component_type,
              product_id: component.product_id,
              available_quantity: availableQty,
              requested_quantity: requestedQty
            });
          }
        }
      }

      if (hasInsufficientStock) {
        errors.push({
          product_id: item.product_id,
          product_name: item.product_name || 'Assembled PC',
          available_quantity: 'Varies by component',
          requested_quantity: item.requested_quantity,
          insufficient_components: insufficientComponents,
          message: `Insufficient stock for Assembled PC "${item.product_name}". Missing components: ${insufficientComponents.map(c => `${c.component_type} (Need: ${c.requested_quantity}, Available: ${c.available_quantity})`).join(', ')}`
        });
      }
    } else {
      // Regular product validation
      const availableQty = stockMap[productTemplete?.id] || 0;
      const requestedQty = item.requested_quantity || 0;

      if (requestedQty > availableQty) {
        errors.push({
          product_id: item.product_id,
          product_name: item.product_name || 'Unknown',
          available_quantity: availableQty,
          requested_quantity: requestedQty,
          message: `Insufficient stock for ${item.product_name || 'Unknown'}. Available QTY: ${availableQty}, Requested QTY: ${requestedQty}.`
        });
      }
    }
  }

  return errors.length ?
    {
      error: true,
      errors
    } :
    {
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
      personal_details, // 🟡 Follows createOrder camelCase
      address,
      items,
    } = req.body;

    // 🔍 Find existing order
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        message: 'Order not found'
      });
    }

    // 🔒 Stock validation if status is changing to "Approved"
    if (order_status === 'Approved') {
      const validation = await validateStockForApprovedOrder(items);
      if (validation.error) {
        return res.status(400).json({
          message: 'Some products have insufficient stock',
          errors: validation.errors
        });
      }
    }

    // 📝 Update order core fields
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
      updated_at: new Date()
    });

    // 📦 Update or create personal details
    if (personal_details) {
      const existingPersonal = await OrderPersonalDetail.findOne({
        where: {
          order_id: id
        }
      });

      if (existingPersonal) {
        await existingPersonal.update(personal_details);
      } else {
        await OrderPersonalDetail.create({
          ...personal_details,
          order_id: id
        });
      }
    }

    // 🏠 Update or create address
    if (address) {
      const existingAddress = await OrderAddress.findOne({
        where: {
          order_id: id
        }
      });

      if (existingAddress) {
        await existingAddress.update(address);
      } else {
        await OrderAddress.create({
          ...address,
          order_id: id
        });
      }
    }

    // 🧾 Replace order items
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

    // ✅ Respond success
    return res.status(200).json({
      message: 'Order updated successfully',
      order
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return res.status(500).json({
      message: 'Error updating order',
      error: error.message || 'Internal Server Error'
    });
  }
};


// ✅ Get All Orders WITH Pagination + Search
export const getAllOrders = async (req, res) => {
  try {

    //---------------------------------------------
    // PAGINATION
    //---------------------------------------------

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    //---------------------------------------------
    // SEARCH
    //---------------------------------------------

    //---------------------------------------------
// SEARCH
//---------------------------------------------

let whereCondition = {};

if (search) {

  whereCondition = {
    [Op.or]: [

      { order_id: { [Op.like]: `%${search}%` } },

      { transaction_type: { [Op.like]: `%${search}%` } },

      { payment_type: { [Op.like]: `%${search}%` } },

      { owner: { [Op.like]: `%${search}%` } },

      { order_status: { [Op.like]: `%${search}%` } },

      //-----------------------------
      // 🔥 SEARCH IN ASSOCIATIONS
      //-----------------------------

      { "$personalDetails.first_name$": { [Op.like]: `%${search}%` } },
      { "$personalDetails.last_name$": { [Op.like]: `%${search}%` } },
      { "$personalDetails.phone_number$": { [Op.like]: `%${search}%` } },

      { "$items.product_name$": { [Op.like]: `%${search}%` } },

      { "$address.city$": { [Op.like]: `%${search}%` } },
      { "$address.state$": { [Op.like]: `%${search}%` } },

    ],
  };
}


    //---------------------------------------------
    // FETCH
    //---------------------------------------------

const { count, rows } = await Order.findAndCountAll({
  where: whereCondition,
  include: [
    {
      model: OrderItem,
      as: "items",
      include: [
        {
          model: ProductTemplete,
          as: "product"
        }
      ],
      required: false  // ✅ Add this to use LEFT JOIN instead of INNER JOIN
    },
    {
      model: OrderAddress,
      as: "address",
      required: false  // ✅ Add this
    },
    {
      model: OrderPersonalDetail,
      as: "personalDetails",
      required: false  // ✅ Add this
    }
  ],
  order: [["created_at", "DESC"]],
  limit,
  offset,
  distinct: true
  // ❌ Remove this line: subQuery: false
});

    //---------------------------------------------
    // CALCULATE TOTALS
    //---------------------------------------------

    const formattedOrders = rows.map(order => {

      const o = order.toJSON();

      let totalValue = 0;

      const itemsWithValue = o.items.map(item => {

        const product = item.product;

        let itemTotal = 0;
        const qty = item.requested_quantity || 0;
        const duration = parseInt(o.rental_duration || 0);

        if (product) {

          if (o.transaction_type === "Rent") {

            if (duration >= 12 && product.rent_price_1_year) {
              itemTotal = qty * product.rent_price_1_year;
            }
            else if (duration >= 6 && product.rent_price_6_months) {
              itemTotal = qty * (duration / 6) * product.rent_price_6_months;
            }
            else if (duration >= 1 && product.rent_price_per_month) {
              itemTotal = qty * duration * product.rent_price_per_month;
            }
            else if (duration < 1 && product.rent_price_per_day) {
              itemTotal = qty * (duration * 30) * product.rent_price_per_day;
            }

          }
          else if (o.transaction_type === "Buy") {
            itemTotal = qty * product.purchase_price;
          }
        }

        totalValue += itemTotal;

        return {
          ...item,
          item_total_value: itemTotal
        };
      });

      const totalQuantity = o.items.reduce(
        (sum, item) => sum + (item.requested_quantity || 0),
        0
      );

      return {
        ...o,
        items: itemsWithValue,
        total_quantity: totalQuantity,
        total_order_value: totalValue,
      };
    });

    //---------------------------------------------

    res.status(200).json({

      orders: formattedOrders,

      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit
      }

    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching orders",
      error: error.message
    });
  }
};






// Get All Orders
export const getAllOrders1 = async (req, res) => {
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
      ],
      order: [
        ['created_at', 'DESC']
      ] // <-- Add this line to sort orders in descending order
    });

    const formattedOrders = await Promise.all(
      orders.map(async (order) => {
        const orderJSON = order.toJSON();
        const {
          transaction_type,
          rental_duration
        } = orderJSON;

        let totalValue = 0;

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
      message: 'Error fetching orders',
      error
    });
  }
};



// Get All Orders
// export const getAllOrders = async (req, res) => {
//   try {
//     const { role_name, id } = req.user;

//     let orders;

//     if (role_name === "Admin") {
//       // ⭐ Admin → Get ALL orders
//       orders = await Order.findAll({
//         include: [
//           { model: OrderItem, as: 'items' },
//           { model: OrderAddress, as: 'address' },
//           { model: OrderPersonalDetail, as: 'personalDetails' },
//           { model: Contact, as: 'customer' }
//         ],
//         order: [['created_at', 'DESC']]
//       });

//     } else {
//       // ⭐ Non-admin → Get orders where Contact.superior_id = loggedInUser.id
//       orders = await Order.findAll({
//         include: [
//           { model: OrderItem, as: 'items' },
//           { model: OrderAddress, as: 'address' },
//           { model: OrderPersonalDetail, as: 'personalDetails' },
//           {
//             model: Contact,
//             as: 'customer',
//             required: true,
//             where: { superior_id: id }   // ⭐ Filter here
//           }
//         ],
//         order: [['created_at', 'DESC']]
//       });
//     }

//     // ⭐ KEEP YOUR EXISTING FORMATTING LOGIC
//     const formattedOrders = await Promise.all(
//       orders.map(async (order) => {
//         const orderJSON = order.toJSON();
//         const { transaction_type, rental_duration } = orderJSON;

//         let totalValue = 0;

//         const itemsWithValue = await Promise.all(
//           orderJSON.items.map(async (item) => {
//             const product = await ProductTemplete.findOne({
//               where: { id: item.product_id }
//             });

//             let itemTotal = 0;
//             const qty = item.requested_quantity || 0;
//             const duration = parseInt(rental_duration);

//             if (product) {
//               if (transaction_type === "Rent") {
//                 if (duration >= 12 && product.rent_price_1_year) {
//                   itemTotal = qty * product.rent_price_1_year;
//                 } else if (duration >= 6 && product.rent_price_6_months) {
//                   itemTotal = qty * (duration / 6) * product.rent_price_6_months;
//                 } else if (duration >= 1 && product.rent_price_per_month) {
//                   itemTotal = qty * duration * product.rent_price_per_month;
//                 } else if (duration < 1 && product.rent_price_per_day) {
//                   itemTotal = qty * (duration * 30) * product.rent_price_per_day;
//                 }
//               } else if (transaction_type === "Buy") {
//                 itemTotal = qty * product.purchase_price;
//               }
//             }

//             totalValue += itemTotal;

//             return {
//               ...item,
//               item_total_value: itemTotal,
//             };
//           })
//         );

//         const totalQuantity = orderJSON.items.reduce(
//           (sum, item) => sum + (item.requested_quantity || 0),
//           0
//         );

//         return {
//           ...orderJSON,
//           total_quantity: totalQuantity,
//           total_order_value: totalValue,
//           personal_details: order.personalDetails,
//           address: order.address,
//           items: itemsWithValue,
//         };
//       })
//     );

//     res.status(200).json(formattedOrders);

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Error fetching orders",
//       error,
//     });
//   }
// };

//UPDATED 05-08-25



// export const getAllOrdersApproved = async (req, res) => {
//   try {
//     const orders = await Order.findAll({
//       where: { order_status: 'Approved' },
//       include: [
//         { model: OrderItem, as: 'items' },
//         { model: OrderAddress, as: 'address' },
//         { model: OrderPersonalDetail, as: 'personalDetails' },
//         { model: Contact, as: 'customer' }
//       ],
//       order: [['id', 'DESC']]
//     });

//     // Utility function to safely parse JSON asset ID fields
//     const parseAssetIds = (input) => {
//       if (Array.isArray(input)) return input;
//       if (!input) return [];
//       try {
//         const parsed = typeof input === 'string' ? JSON.parse(input) : input;
//         return Array.isArray(parsed) ? parsed : [];
//       } catch {
//         return [];
//       }
//     };

//     const formattedOrders = await Promise.all(
//       orders.map(async (order) => {
//         const orderJSON = order.toJSON();
//         let totalValue = 0;

//         const itemsWithValue = await Promise.all(
//           orderJSON.items.map(async (item) => {
//             // 1. Get product details
//             const product = await ProductTemplete.findByPk(item.product_id);
//             let itemTotal = 0;

//             if (product) {
//               if (orderJSON.transaction_type === 'Rent') {
//                 // Add your rent calculation logic here if needed
//               } else if (orderJSON.transaction_type === 'Buy') {
//                 itemTotal = (item.requested_quantity || 0) * product.purchase_price;
//               }
//             }
//             totalValue += itemTotal;

//             // 2. Get all GRN assets for the product
//             const grnItems = await GoodsReceiptItem.findAll({
//               where: { product_id: item.product_id },
//               attributes: ['asset_ids'],
//               raw: true
//             });
//             const allGrnAssets = grnItems.flatMap(grn => parseAssetIds(grn.asset_ids));

//             // 3. Get all dispatched assets for this product (across all orders)
//             const allDispatchItems = await DispatchOrderItem.findAll({
//               where: { product_id: item.product_id },
//               attributes: ['device_ids'],
//               raw: true
//             });
//             const allDispatchedAssets = allDispatchItems.flatMap(d => parseAssetIds(d.device_ids));
//             const dispatchedSet = new Set(allDispatchedAssets);

//             // 4. Get all returned assets from Credit Notes
//             const creditNoteItems = await CreditNoteItem.findAll({
//               where: { product_id: item.product_id },
//               attributes: ['device_ids'],
//               raw: true
//             });
//             const returnedAssets = creditNoteItems.flatMap(cn => parseAssetIds(cn.device_ids));
//             const returnedSet = new Set(returnedAssets);

//             // 5. Calculate available asset IDs: (GRN - Dispatched) + Returned
//             const availableAssetIds = allGrnAssets.filter(id =>
//               !dispatchedSet.has(id) || returnedSet.has(id)
//             );

//             return {
//               ...item,
//               item_total_value: itemTotal,
//               available_asset_ids: availableAssetIds,
//               total_grn_assets: allGrnAssets.length,
//               dispatched_count: dispatchedSet.size,
//               returned_count: returnedSet.size
//             };
//           })
//         );

//         return {
//           ...orderJSON,
//           total_order_value: totalValue,
//           personal_details: orderJSON.personalDetails,
//           address: order.address,
//           items: itemsWithValue
//         };
//       })
//     );

//     res.status(200).json(formattedOrders);
//   } catch (error) {
//     console.error('Error in getAllOrdersApproved:', error);
//     res.status(500).json({
//       message: 'Error fetching approved orders',
//       error: error.message
//     });
//   }
// };





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

    // Utility function to safely parse JSON asset ID fields
    const parseAssetIds = (input) => {
      if (Array.isArray(input)) return input;
      if (!input) return [];
      try {
        const parsed = typeof input === 'string' ? JSON.parse(input) : input;
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const formattedOrders = await Promise.all(
      orders.map(async (order) => {
        const orderJSON = order.toJSON();
        let totalValue = 0;

        const itemsWithValue = await Promise.all(
          orderJSON.items.map(async (item) => {
            // 1. Get product details
            const product = await ProductTemplete.findByPk(item.product_id);
            let itemTotal = 0;

            if (product) {
              if (orderJSON.transaction_type === 'Rent') {
                // Add your rent calculation logic here if needed
              } else if (orderJSON.transaction_type === 'Buy') {
                itemTotal = (item.requested_quantity || 0) * product.purchase_price;
              }
            }
            totalValue += itemTotal;

            // 2. Get all GRN assets for the product
            const grnItems = await GoodsReceiptItem.findAll({
              where: { product_id: item.product_id },
              attributes: ['asset_ids'],
              raw: true
            });
            const allGrnAssets = grnItems.flatMap(grn => parseAssetIds(grn.asset_ids));

            // 3. Get all dispatched assets for this product (across all orders)
            const allDispatchItems = await DispatchOrderItem.findAll({
              where: { product_id: item.product_id },
              attributes: ['device_ids'],
              raw: true
            });
            const allDispatchedAssets = allDispatchItems.flatMap(d => parseAssetIds(d.device_ids));
            const dispatchedSet = new Set(allDispatchedAssets);

            // 4. Get all returned assets from Credit Notes
            const creditNoteItems = await CreditNoteItem.findAll({
              where: { product_id: item.product_id },
              attributes: ['device_ids'],
              raw: true
            });
            const returnedAssets = creditNoteItems.flatMap(cn => parseAssetIds(cn.device_ids));
            const returnedSet = new Set(returnedAssets);

            // 5. Calculate available asset IDs: (GRN - Dispatched) + Returned
            const availableAssetIds = allGrnAssets.filter(id =>
              !dispatchedSet.has(id) || returnedSet.has(id)
            );

            return {
              ...item,
              item_total_value: itemTotal,
              available_asset_ids: availableAssetIds,
              total_grn_assets: allGrnAssets.length,
              dispatched_count: dispatchedSet.size,
              returned_count: returnedSet.size
            };
          })
        );

        return {
          ...orderJSON,
          total_order_value: totalValue,
          personal_details: orderJSON.personalDetails,
          address: order.address,
          items: itemsWithValue
        };
      })
    );

    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error('Error in getAllOrdersApproved:', error);
    res.status(500).json({
      message: 'Error fetching approved orders',
      error: error.message
    });
  }
};






// export const getAllOrdersApproved = async (req, res) => {
//   try {
//     const { role_name, id } = req.user;

//     let orders;

//     if (role_name === "Admin") {
//       // ⭐ Admin → all approved
//       orders = await Order.findAll({
//         where: { order_status: "Approved" },
//         include: [
//           { model: OrderItem, as: "items" },
//           { model: OrderAddress, as: "address" },
//           { model: OrderPersonalDetail, as: "personalDetails" },
//           { model: Contact, as: "customer" },
//         ],
//         order: [["id", "DESC"]],
//       });

//     } else {
//       // ⭐ Non-admin → approved + Contact.superior_id = login user
//       orders = await Order.findAll({
//         where: { order_status: "Approved" },
//         include: [
//           { model: OrderItem, as: "items" },
//           { model: OrderAddress, as: "address" },
//           { model: OrderPersonalDetail, as: "personalDetails" },
//           {
//             model: Contact,
//             as: "customer",
//             required: true,
//             where: { superior_id: id }, // ⭐ Filter here
//           },
//         ],
//         order: [["id", "DESC"]],
//       });
//     }

//     // ⭐ Keep ALL your remaining logic exactly same
//     const parseAssetIds = (input) => {
//       if (Array.isArray(input)) return input;
//       if (!input) return [];
//       try {
//         const parsed = typeof input === "string" ? JSON.parse(input) : input;
//         return Array.isArray(parsed) ? parsed : [];
//       } catch {
//         return [];
//       }
//     };

//     const formattedOrders = await Promise.all(
//       orders.map(async (order) => {
//         const orderJSON = order.toJSON();
//         let totalValue = 0;

//         const itemsWithValue = await Promise.all(
//           orderJSON.items.map(async (item) => {
//             const product = await ProductTemplete.findByPk(item.product_id);
//             let itemTotal = 0;

//             if (product && orderJSON.transaction_type === "Buy") {
//               itemTotal = (item.requested_quantity || 0) * product.purchase_price;
//             }

//             totalValue += itemTotal;

//             const grnItems = await GoodsReceiptItem.findAll({
//               where: { product_id: item.product_id },
//               attributes: ["asset_ids"],
//               raw: true,
//             });
//             const allGrnAssets = grnItems.flatMap((g) => parseAssetIds(g.asset_ids));

//             const allDispatchItems = await DispatchOrderItem.findAll({
//               where: { product_id: item.product_id },
//               attributes: ["device_ids"],
//               raw: true,
//             });
//             const allDispatchedAssets = allDispatchItems.flatMap((d) =>
//               parseAssetIds(d.device_ids)
//             );
//             const dispatchedSet = new Set(allDispatchedAssets);

//             const creditNoteItems = await CreditNoteItem.findAll({
//               where: { product_id: item.product_id },
//               attributes: ["device_ids"],
//               raw: true,
//             });
//             const returnedAssets = creditNoteItems.flatMap((c) =>
//               parseAssetIds(c.device_ids)
//             );
//             const returnedSet = new Set(returnedAssets);

//             const availableAssetIds = allGrnAssets.filter(
//               (id) => !dispatchedSet.has(id) || returnedSet.has(id)
//             );

//             return {
//               ...item,
//               item_total_value: itemTotal,
//               available_asset_ids: availableAssetIds,
//             };
//           })
//         );

//         return {
//           ...orderJSON,
//           total_order_value: totalValue,
//           personal_details: orderJSON.personalDetails,
//           address: order.address,
//           items: itemsWithValue,
//         };
//       })
//     );

//     res.status(200).json(formattedOrders);

//   } catch (error) {
//     console.error("Error in getAllOrdersApproved:", error);
//     res.status(500).json({
//       message: "Error fetching approved orders",
//       error: error.message,
//     });
//   }
// };



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