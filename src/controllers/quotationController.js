import db from '../models/index.js';
import {
  Op
} from "sequelize";
const {
  sequelize
} = db; // ✅ Add this

const Quotation = db.Quotation;
const QuotationItem = db.QuotationItem;
const Product = db.Product;
const Lead = db.Lead;
const GoodsReceiptItem = db.GoodsReceiptItem;
const Order = db.Order;
const OrderItem = db.OrderItem;
const Contact = db.Contact;
const ProductTemplete = db.ProductTemplete;

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
      is_direct_invoice,
      items
    } = req.body;

    // ✅ Collect all asset_ids from request
    const allAssetIds = items?.flatMap((item) => item.asset_ids || []) || [];

    if (allAssetIds.length > 0) {
      // ✅ Check for duplicates within the request itself
      const duplicateInRequest = allAssetIds.filter(
        (id, idx) => allAssetIds.indexOf(id) !== idx
      );

      if (duplicateInRequest.length > 0) {
        return res.status(400).json({
          message: "Duplicate Asset IDs found in request",
          duplicates: [...new Set(duplicateInRequest)],
        });
      }

      // ✅ Check for duplicates in DB
      const existingItems = await QuotationItem.findAll({
        where: sequelize.literal(
          `JSON_OVERLAPS(device_ids, '${JSON.stringify(allAssetIds)}')`
        ),
        attributes: ["id", "product_name", "device_ids"],
      });

      if (existingItems.length > 0) {
        const foundDuplicates = [];
        existingItems.forEach((row) => {
          const storedIds = row.device_ids || [];
          const overlap = storedIds.filter((id) => allAssetIds.includes(id));
          overlap.forEach((id) => {
            foundDuplicates.push({
              asset_id: id,
              product_name: row.product_name || "Unknown Product",
            });
          });
        });

        return res.status(400).json({
          message: "Duplicate Asset IDs found in database",
          duplicates: foundDuplicates,
        });
      }
    }

    // ✅ Create main quotation
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
      is_direct_invoice: is_direct_invoice ?? false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // ✅ Create quotation items
    if (items && Array.isArray(items)) {
      const itemsWithDeviceIds = await Promise.all(
        items.map(async (item) => {
          const product = await Product.findByPk(item.product_id);

          return {
            quotation_id: quotation.id,
            product_id: item.product_id,
            product_name: item.product_name,
            requested_quantity: item.requested_quantity,
            quotation_quantity: item.quotation_quantity,
            purchase_price: item.purchase_price || 0,
            offer_purchase_price: item.offer_purchase_price || 0,
            rent_price_per_month: item.rent_price_per_month || 0,
            offer_rent_price_per_month: item.offer_rent_price_per_month || 0,
            device_ids: item.asset_ids || [],
            created_at: new Date(),
            updated_at: new Date(),
          };
        })
      );

      await QuotationItem.bulkCreate(itemsWithDeviceIds);
    }

    res.status(201).json({
      message: "Quotation created successfully",
      quotation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error creating quotation",
      error: error.message,
    });
  }
};





// Get all quotations
export const getAllQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.findAll({
      include: [{
        model: QuotationItem,
        as: 'items', // use the same alias as defined in the model
      }],
      order: [
        ['created_at', 'DESC']
      ] // <-- Sort by created_at descending
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




// Get all quotations
// export const getAllQuotations = async (req, res) => {
//   try {
//     const { role_name, id } = req.user;

//     let quotations;

//     if (role_name === "Admin") {
//       // ⭐ Admin gets all quotations
//       quotations = await Quotation.findAll({
//         include: [
//           {
//             model: QuotationItem,
//             as: "items",
//           },
//           {
//             model: Lead,
//             as: "lead",
//             include: [
//               {
//                 model: Contact,
//                 as: "contact",
//               },
//             ],
//           },
//         ],
//         order: [["created_at", "DESC"]],
//       });
//     } else {
//       // ⭐ Non-admin filtered by Contact.superior_id = loggedInUser.id
//       quotations = await Quotation.findAll({
//         include: [
//           {
//             model: QuotationItem,
//             as: "items",
//           },
//           {
//             model: Lead,
//             as: "lead",
//             required: true,
//             include: [
//               {
//                 model: Contact,
//                 as: "contact",
//                 required: true,
//                 where: { superior_id: id }, // ⭐ FILTER HERE
//               },
//             ],
//           },
//         ],
//         order: [["created_at", "DESC"]],
//       });
//     }

//     res.status(200).json(quotations);

//   } catch (error) {
//     console.error("Error fetching quotations:", error);
//     res.status(500).json({
//       message: "Error fetching quotations",
//       error: error.message,
//     });
//   }
// };


export const getAllQuotationsApproved = async (req, res) => {
  try {
    const quotations = await Quotation.findAll({
      where: {
        status: 'Approved',
        is_direct_invoice: false
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
      order: [
        ['id', 'DESC']
      ] // <-- Sort leads by created_at descending

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






// export const getAllQuotationsApproved = async (req, res) => {
//   try {
//     const { role_name, id } = req.user;

//     let quotations;

//     if (role_name === "Admin") {
//       // ⭐ Admin → get all
//       quotations = await Quotation.findAll({
//         where: {
//           status: 'Approved',
//           is_direct_invoice: false
//         },
//         include: [
//           {
//             model: QuotationItem,
//             as: 'items',
//             include: [{
//               model: db.GoodsReceiptItem,
//               as: 'goodsReceiptItems',
//               attributes: ['id', 'goods_receipt_id', 'product_id', 'asset_ids'],
//             }],
//           },
//           {
//             model: Contact,
//             as: 'customer',
//             attributes: [
//               'id',
//               'first_name',
//               'last_name',
//               'email',
//               'phone_number',
//               'company_name',
//               'customer_id',
//               'industry',
//               'payment_type',
//               'gst',
//               'pan_no',
//               'owner',
//               'remarks',
//               'status',
//               'created_at',
//               'updated_at',
//               'address'
//             ],
//           },
//         ],
//         order: [['id', 'DESC']]
//       });

//     } else {
//       // ⭐ Non-admin → filter by superior_id
//       quotations = await Quotation.findAll({
//         where: {
//           status: 'Approved',
//           is_direct_invoice: false
//         },
//         include: [
//           {
//             model: QuotationItem,
//             as: 'items',
//             include: [{
//               model: db.GoodsReceiptItem,
//               as: 'goodsReceiptItems',
//               attributes: ['id', 'goods_receipt_id', 'product_id', 'asset_ids'],
//             }],
//           },
//           {
//             model: Contact,
//             as: 'customer',
//             required: true,
//             where: { superior_id: id },   // ⭐ IMPORTANT FILTER
//             attributes: [
//               'id',
//               'first_name',
//               'last_name',
//               'email',
//               'phone_number',
//               'company_name',
//               'customer_id',
//               'industry',
//               'payment_type',
//               'gst',
//               'pan_no',
//               'owner',
//               'remarks',
//               'status',
//               'created_at',
//               'updated_at',
//               'address'
//             ],
//           },
//         ],
//         order: [['id', 'DESC']]
//       });
//     }

//     // ⭐ KEEP ALL EXISTING REMAINING LOGIC EXACTLY SAME
//     const approvedOrders = await Order.findAll({
//       where: {
//         order_status: 'Approved'
//       },
//       include: [{
//         model: OrderItem,
//         as: 'items',
//         attributes: ['product_id', 'device_ids'],
//       }],
//     });

//     const usedDeviceMap = {};

//     approvedOrders.forEach(order => {
//       order.items.forEach(item => {
//         const productId = item.product_id;
//         let deviceIds = [];

//         try {
//           deviceIds = Array.isArray(item.device_ids) ?
//             item.device_ids :
//             JSON.parse(item.device_ids || '[]');
//         } catch (err) {
//           console.warn('Invalid device_ids JSON:', item.device_ids);
//         }

//         if (!usedDeviceMap[productId]) {
//           usedDeviceMap[productId] = new Set();
//         }

//         deviceIds.forEach(id => usedDeviceMap[productId].add(id));
//       });
//     });

//     quotations.forEach(q => {
//       q.items.forEach(item => {
//         const allAssets = [];

//         item.goodsReceiptItems?.forEach(grn => {
//           if (Array.isArray(grn.asset_ids)) {
//             allAssets.push(...grn.asset_ids);
//           }
//         });

//         const usedSet = usedDeviceMap[item.product_id] || new Set();
//         const remainingAssets = allAssets.filter(asset => !usedSet.has(asset));
//         item.setDataValue('available_asset_ids', remainingAssets);
//       });
//     });

//     res.status(200).json(quotations);

//   } catch (error) {
//     console.error('Error fetching approved quotations with remaining assets:', error);
//     res.status(500).json({
//       message: 'Error fetching approved quotations with remaining assets',
//       error,
//     });
//   }
// };






// Get quotation by ID
export const getQuotationById = async (req, res) => {
  try {
    const {
      id
    } = req.params;

    const quotation = await Quotation.findByPk(id, {
      include: [{
          model: QuotationItem,
          as: 'items',
          include: [{
            model: ProductTemplete,
            as: 'product', // ✅ now valid
          }, ],
        },
        {
          model: Contact,
          as: 'customer',
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
            'address',
          ],
        },
      ],
    });

    if (!quotation) {
      return res.status(404).json({
        message: 'Quotation not found'
      });
    }

    res.status(200).json(quotation);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching quotation',
      error,
    });
  }
};


// Update quotation
export const updateQuotation = async (req, res) => {
  try {
    const {
      id
    } = req.params;
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
      lead_id,
      is_direct_invoice,
    } = req.body;

    const quotation = await Quotation.findByPk(id);
    if (!quotation) {
      return res.status(404).json({
        message: "Quotation not found"
      });
    }

    // ✅ Collect all asset_ids from request
    const allAssetIds = items?.flatMap((item) => item.asset_ids || []) || [];

    if (allAssetIds.length > 0) {
      // ✅ Check for duplicates in the request itself
      const duplicateInRequest = allAssetIds.filter(
        (id, idx) => allAssetIds.indexOf(id) !== idx
      );

      if (duplicateInRequest.length > 0) {
        return res.status(400).json({
          message: "Duplicate Asset IDs found in request",
          duplicates: [...new Set(duplicateInRequest)],
        });
      }

      // ✅ Check for duplicates in DB (excluding current quotation's items)
      const existingItems = await QuotationItem.findAll({
        where: {
          quotation_id: {
            [Op.ne]: id
          }, // exclude current quotation
        },
        attributes: ["id", "product_name", "device_ids"],
      });

      const foundDuplicates = [];
      existingItems.forEach((row) => {
        const storedIds = row.device_ids || [];
        const overlap = storedIds.filter((id) => allAssetIds.includes(id));
        overlap.forEach((id) => {
          foundDuplicates.push({
            asset_id: id,
            product_name: row.product_name || "Unknown Product",
          });
        });
      });

      // ✅ Deduplicate before returning
      const seen = new Set();
      const uniqueDuplicates = foundDuplicates.filter((d) => {
        const key = `${d.asset_id}-${d.product_name}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (uniqueDuplicates.length > 0) {
        return res.status(400).json({
          message: "Duplicate Asset IDs found in database",
          duplicates: uniqueDuplicates,
        });
      }
    }

    // ✅ Update quotation
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
      is_direct_invoice: is_direct_invoice ?? false,
      updated_at: new Date(),
    });

    // ✅ Handle items update
    if (items && items.length > 0) {
      await QuotationItem.destroy({
        where: {
          quotation_id: id
        }
      });

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
        device_ids: item.asset_ids || [], // ✅ Add this back
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