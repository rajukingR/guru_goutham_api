import db from '../models/index.js';
import {
  Op
} from "sequelize";

const {
  DeliveryChallan,
  DeliveryChallanItem,
  OrderItem,
  Order,
  DispatchOrder,
  ProductTemplete,
  Contact,
  GoodsReceiptItem
} = db;

const CreditNote = db.CreditNote;
const CreditNoteItem = db.CreditNoteItem;
const AssetSwap = db.AssetSwap;
const AssetTransaction = db.AssetTransaction;

// Create Delivery Challan 
export const createDeliveryChallan = async (req, res) => {
  try {
    const {
      dc_id,
      dc_title,
      is_dc,
      order_id,
      dispatch_order_number,
      customer_code,
      order_number,
      dc_date,
      dc_status,
      dealer_reference,
      email,
      gst_number,
      pan_number,
      remarks,
      dc_file,
      type,
      payment_type,
      regular_dc,
      industry,
      shipping_ordered_by,
      shipping_phone_number,
      shipping_name,
      street,
      landmark,
      pincode,
      city,
      state,
      country,
      vehicle_number,
      delivery_person_name,
      delivery_person_phone_number,
      receiver_name,
      receiver_phone_number,
      mouse,
      cable,
      bag,
      others,
      other_accessory,
      defualt_dc,
      is_direct_invoice,
      mouse_qty,
      cable_qty,
      bag_qty,
      others_qty,
      items
    } = req.body;

    // 🔎 Step 1: Find the dispatch order
    const dispatchOrder = await DispatchOrder.findOne({
      where: {
        id: order_id
      }, // adjust if you actually receive dispatch_order_number
      attributes: ["id", "peripheral_update"],
    });

    if (!dispatchOrder) {
      return res.status(404).json({
        message: "Dispatch Order not found"
      });
    }

    // Convert "wi-fi card,adapter" → ["wi-fi card", "adapter"]
    let parsedAccessories = other_accessory;
    if (typeof other_accessory === "string") {
      parsedAccessories = other_accessory
        .split(",")
        .map(acc => acc.trim())
        .filter(acc => acc.length > 0);
    }

    const deliveryChallan = await DeliveryChallan.create({
      dc_id,
      dc_title,
      is_dc,
      order_id,
      dispatch_order_id: dispatchOrder.id,
      dispatch_order_number,
      customer_code,
      order_number,
      dc_date,
      dc_status,
      dealer_reference,
      email,
      gst_number,
      pan_number,
      remarks,
      dc_file,
      type,
      payment_type,
      regular_dc,
      industry,
      shipping_ordered_by,
      shipping_phone_number,
      shipping_name,
      street,
      landmark,
      pincode,
      city,
      state,
      country,
      vehicle_number,
      delivery_person_name,
      delivery_person_phone_number,
      peripheral_update: dispatchOrder.peripheral_update,
      receiver_name,
      receiver_phone_number,
      mouse,
      cable,
      bag,
      others,
      other_accessory: parsedAccessories, // ✅ save as JSON
      defualt_dc,
      is_direct_invoice,
      mouse_qty: mouse_qty || 0,
      cable_qty: cable_qty || 0,
      bag_qty: bag_qty || 0,
      others_qty: others_qty || 0,
    });

    // 🔎 Step 3: Save items if present
    if (items && Array.isArray(items)) {
      const formattedItems = items.map((item) => ({
        ...item,
        challan_id: deliveryChallan.id,
        device_ids: JSON.stringify(item.device_ids || []),
      }));
      await DeliveryChallanItem.bulkCreate(formattedItems);
    }

    res.status(201).json({
      message: "Delivery Challan created successfully",
      deliveryChallan,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error creating delivery challan",
      error
    });
  }
};


export const getAllDeliveryChallans = async (req, res) => {
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

    let whereCondition = {
      is_direct_invoice: false
    };

    if (search) {

      whereCondition = {
        is_direct_invoice: false,

        [Op.or]: [

          { dc_id: { [Op.like]: `%${search}%` } },

          { dispatch_order_number: { [Op.like]: `%${search}%` } },

          { shipping_name: { [Op.like]: `%${search}%` } },

          { city: { [Op.like]: `%${search}%` } },

          { vehicle_number: { [Op.like]: `%${search}%` } },

          { delivery_person_name: { [Op.like]: `%${search}%` } },

          { delivery_person_phone_number: { [Op.like]: `%${search}%` } },

          { dc_status: { [Op.like]: `%${search}%` } },

          { payment_type: { [Op.like]: `%${search}%` } },

          //-----------------------------
          // 🔥 SEARCH INSIDE ITEMS
          //-----------------------------

          { "$items.product_name$": { [Op.like]: `%${search}%` } },

        ]
      };
    }

    //---------------------------------------------
    // FETCH
    //---------------------------------------------

    const { count, rows } = await DeliveryChallan.findAndCountAll({

      where: whereCondition,

      include: [
        {
          model: DeliveryChallanItem,
          as: "items",
        }
      ],

      order: [["created_at", "DESC"]],

      limit,
      offset,

      distinct: true,
      subQuery: false   // 🔥 VERY IMPORTANT
    });

    //---------------------------------------------

    res.status(200).json({

      deliveryChallans: rows,

      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit
      }

    });

  } catch (error) {

    console.error("Error fetching delivery challans:", error);

    res.status(500).json({
      message: "Error fetching delivery challans",
      error: error.message
    });
  }
};




// Get All Delivery Challans
export const getAllDeliveryChallans1 = async (req, res) => {
  try {
    const deliveryChallans = await DeliveryChallan.findAll({
      where: {
        is_direct_invoice: false, // ✅ exclude direct invoices
      },
      include: [{
        model: DeliveryChallanItem,
        as: 'items',
      }, ],
      order: [
        ['created_at', 'DESC']
      ], // descending order
    });

    res.status(200).json(deliveryChallans);
  } catch (error) {
    console.error("Error fetching delivery challans:", error);
    res.status(500).json({
      message: "Error fetching delivery challans",
      error,
    });
  }
};




// export const getAllDeliveryChallans = async (req, res) => {
//   try {
//     const { role_name, id } = req.user;

//     let deliveryChallans;

//     if (role_name === "Admin") {
//       // ⭐ Admin: Fetch ALL Delivery Challans
//       deliveryChallans = await DeliveryChallan.findAll({
//         where: {
//           is_direct_invoice: false,
//         },
//         include: [
//           { model: DeliveryChallanItem, as: "items" },
//           { model: Contact, as: "customer" } // ⭐ Correct alias
//         ],
//         order: [["created_at", "DESC"]],
//       });

//     } else {
//       // ⭐ Non-Admin: Fetch ONLY delivery challans created by this user
//       deliveryChallans = await DeliveryChallan.findAll({
//         where: {
//           is_direct_invoice: false,
//         },
//         include: [
//           { model: DeliveryChallanItem, as: "items" },
//           {
//             model: Contact,
//             as: "customer",    // ⭐ Must match model alias
//             required: true,
//             where: { superior_id: id },  // ⭐ Main filter
//           },
//         ],
//         order: [["created_at", "DESC"]],
//       });
//     }

//     res.status(200).json(deliveryChallans);

//   } catch (error) {
//     console.error("Error fetching delivery challans:", error);
//     res.status(500).json({
//       message: "Error fetching delivery challans",
//       error: error.message,
//     });
//   }
// };



export const getAllDeliveryChallanDelivered = async (req, res) => {
  try {
    // Step 1: Fetch all CreditNotes with their items
    const allCreditNotes = await CreditNote.findAll({
      include: [{
        model: CreditNoteItem,
        as: 'items'
      }]
    });

    // Step 2: Build a map of returned devices by dispatch_order_id + product_id
    const returnedDeviceMap = {};
    for (const note of allCreditNotes) {
      const dispatchOrderId = Number(note.dispatch_order_id);
      if (!returnedDeviceMap[dispatchOrderId]) returnedDeviceMap[dispatchOrderId] = {};

      for (const item of note.items) {
        const productId = item.product_id;
        const returnedDevices = Array.isArray(item.device_ids) ?
          item.device_ids :
          JSON.parse(item.device_ids || '[]');

        if (!returnedDeviceMap[dispatchOrderId][productId]) {
          returnedDeviceMap[dispatchOrderId][productId] = new Set();
        }

        returnedDevices.forEach(id =>
          returnedDeviceMap[dispatchOrderId][productId].add(id)
        );
      }
    }

    // Step 3: Fetch Delivered DCs with full associations
    const allDeliveryChallans = await DeliveryChallan.findAll({
      where: {
        dc_status: 'Delivered',
        peripheral_update: false,
        defualt_dc: false // 🚨 Exclude default DCs
      },
      include: [{
          model: DeliveryChallanItem,
          as: 'items',
          include: [{
            model: ProductTemplete,
            as: 'product'
          }]
        },
        {
          model: Contact,
          as: 'customer',
          attributes: [
            'id', 'first_name', 'last_name', 'customer_id',
            'email', 'phone_number', 'company_name', 'gst',
            'pan_no', 'address'
          ],
          required: false
        },
        {
          model: DispatchOrder,
          as: 'dispatch_order',
          required: false
        }
      ],
      order: [
        ['id', 'DESC']
      ]
    });

    // Step 4: Adjust each item's device_ids and quantity
    for (const dc of allDeliveryChallans) {
      const dispatchOrderId = dc.dispatch_order_id;

      dc.items = dc.items
        .map(item => {
          const productId = item.product_id;

          const deviceIds = Array.isArray(item.device_ids) ?
            item.device_ids :
            JSON.parse(item.device_ids || '[]');

          const returnedSet =
            returnedDeviceMap[dispatchOrderId]?. [productId] ?? new Set();

          const filteredDeviceIds = deviceIds.filter(
            id => !returnedSet.has(id)
          );

          item.device_ids = filteredDeviceIds;
          item.quantity = filteredDeviceIds.length;

          return item;
        })
        .filter(item => item.quantity > 0);
    }

    // Remove DCs with no items
    const filteredDCs = allDeliveryChallans.filter(dc => dc.items.length > 0);

    return res.status(200).json(filteredDCs);
  } catch (error) {
    console.error('Error fetching delivered DCs:', error);
    return res.status(500).json({
      message: 'Error fetching delivered delivery challans',
      error: error.message
    });
  }
};







// Get Delivery Challans by Customer Code
// Get Delivery Challans by Customer Code
export const getDeliveryChallansByCustomerCode = async (req, res) => {
  const {
    customer_code
  } = req.params;

  // Helper: safely parse device_ids
  function parseDeviceIds(deviceIdsRaw) {
    if (!deviceIdsRaw) return [];
    try {
      const parsed = typeof deviceIdsRaw === "string" ? JSON.parse(deviceIdsRaw) : deviceIdsRaw;
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn("Invalid device_ids JSON:", deviceIdsRaw);
      return [];
    }
  }

  try {
    // 1. Fetch Delivery Challans (with items)
    let deliveryChallans = await DeliveryChallan.findAll({
      where: {
        customer_code
      },
      include: [{
        model: DeliveryChallanItem,
        as: "items"
      }],
      order: [
        ["created_at", "DESC"]
      ],
    });

    // 2. Filter out challans where peripheral_update = true
    deliveryChallans = deliveryChallans.filter((dc) => !dc.peripheral_update);

    // 3. Collect dispatch_order_ids
    const dispatchOrderIds = deliveryChallans.map((dc) => dc.dispatch_order_id);

    // 4. Fetch Credit Notes (returns)
    const creditNotes = await CreditNote.findAll({
      where: {
        dispatch_order_id: dispatchOrderIds
      },
      include: [{
        model: CreditNoteItem,
        as: "items"
      }],
    });

    const creditNoteMap = {};
    creditNotes.forEach((cn) => {
      if (!creditNoteMap[cn.dispatch_order_id]) {
        creditNoteMap[cn.dispatch_order_id] = [];
      }
      creditNoteMap[cn.dispatch_order_id].push(...(cn.items || []));
    });

    // 5. Fetch Asset Swaps (swapped-out devices)
    const assetSwaps = await AssetSwap.findAll({
      where: {
        swapped_on: {
          [Op.ne]: null
        }
      }, // only valid swaps
      raw: true,
    });

    // Build a product_id → swappedIds map
    const swappedMap = {};
    for (const swap of assetSwaps) {
      if (!swappedMap[swap.product_id]) swappedMap[swap.product_id] = [];
      swappedMap[swap.product_id].push(swap.asset_id);
    }

    // 6. Mutate challan items
    for (const challan of deliveryChallans) {
      const creditItems = creditNoteMap[challan.dispatch_order_id] || [];

      for (const item of challan.items) {
        const originalDeviceIds = parseDeviceIds(item.device_ids);
        let updatedDeviceIds = [...originalDeviceIds];

        // Subtract returned devices (Credit Notes)
        const matchingReturns = creditItems.filter((ci) => ci.product_id === item.product_id);
        for (const ret of matchingReturns) {
          const returnedIds = parseDeviceIds(ret.device_ids);
          updatedDeviceIds = updatedDeviceIds.filter((id) => !returnedIds.includes(id));
        }

        // Subtract swapped devices (AssetSwaps)
        const swappedIds = swappedMap[item.product_id] || [];
        updatedDeviceIds = updatedDeviceIds.filter((id) => !swappedIds.includes(id));

        // Final update
        item.device_ids = updatedDeviceIds;
        item.quantity = updatedDeviceIds.length;
      }
    }

    res.status(200).json(deliveryChallans);
  } catch (error) {
    console.error("Error fetching delivery challans by customer_code:", error);
    res.status(500).json({
      message: "Error fetching delivery challans",
      error,
    });
  }
};





export const getDeliveryChallansByCustomerCode1 = async (req, res) => {
  const {
    customer_code
  } = req.params;

  function parseDeviceIds(deviceIdsRaw) {
    if (!deviceIdsRaw) return [];
    try {
      const parsed = typeof deviceIdsRaw === 'string' ? JSON.parse(deviceIdsRaw) : deviceIdsRaw;
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Invalid device_ids JSON in challan item:', deviceIdsRaw);
      return [];
    }
  }

  try {
    // 1. Fetch challans with items, product, customer
    let deliveryChallans = await DeliveryChallan.findAll({
      where: {
        customer_code
      },
      include: [{
          model: DeliveryChallanItem,
          as: 'items',
          include: [{
            model: ProductTemplete,
            as: 'product'
          }]
        },
        {
          model: Contact,
          as: 'customer',
          attributes: [
            'id', 'first_name', 'last_name', 'customer_id',
            'email', 'phone_number', 'company_name',
            'gst', 'pan_no', 'address',
            'industry', 'payment_type', 'owner', 'status'
          ]
        }
      ],
      order: [
        ['created_at', 'DESC']
      ]
    });

    // 2. Remove peripheral_update = true challans
    deliveryChallans = deliveryChallans.filter(dc => !dc.peripheral_update);

    // 3. Fetch credit notes
    const dispatchOrderIds = deliveryChallans.map(dc => dc.dispatch_order_id);
    const creditNotes = await CreditNote.findAll({
      where: {
        dispatch_order_id: dispatchOrderIds
      },
      include: [{
        model: CreditNoteItem,
        as: 'items'
      }]
    });

    const creditNoteMap = {};
    creditNotes.forEach(cn => {
      if (!creditNoteMap[cn.dispatch_order_id]) {
        creditNoteMap[cn.dispatch_order_id] = [];
      }
      creditNoteMap[cn.dispatch_order_id].push(...(cn.items || []));
    });

    // 4. Collect all device IDs + product IDs
    const allDeviceIds = [];
    const allProductIds = new Set();

    deliveryChallans.forEach(dc => {
      dc.items.forEach(item => {
        const deviceIds = parseDeviceIds(item.device_ids);
        allDeviceIds.push(...deviceIds);
        allProductIds.add(item.product_id);
      });
    });

    // 5. Fetch swapped devices
    const assetSwaps = await AssetSwap.findAll({
      where: {
        [Op.or]: [{
            asset_id: {
              [Op.in]: allDeviceIds
            }
          },
          {
            product_id: {
              [Op.in]: Array.from(allProductIds)
            }
          }
        ]
      }
    });

    const swappedDeviceIds = new Set(assetSwaps.map(s => s.asset_id));

    // 6. Customer
    let customer = deliveryChallans[0]?.customer || null;

    // 7. Fetch asset transactions
    let assetTransactions = [];
    if (customer && allDeviceIds.length > 0) {
      assetTransactions = await AssetTransaction.findAll({
        where: {
          customer_id: customer.id,
          parent_asset_id: {
            [Op.in]: allDeviceIds
          }
        },
        order: [
          ['parent_asset_id', 'ASC'],
          ['action_date', 'ASC']
        ]
      });
    }

    // 8. Format transactions by device_id
    const assetTransactionsByDevice = {};
    assetTransactions.forEach(txn => {
      const deviceId = txn.parent_asset_id;
      if (!assetTransactionsByDevice[deviceId]) {
        assetTransactionsByDevice[deviceId] = [];
      }
      assetTransactionsByDevice[deviceId].push({
        id: txn.id,
        customer_id: txn.customer_id,
        product_id: txn.product_id,
        peripheral_asset_id_product_id: txn.peripheral_asset_id_product_id,
        parent_asset_id: txn.parent_asset_id,
        asset_id: txn.asset_id,
        size: txn.size,
        action_date: txn.action_date,
        item_name: txn.item_name,
        specification: txn.specification,
        item_type: txn.item_type,
        price: txn.price,
        status: txn.status,
        is_default: txn.is_default,
        credit_note_id: txn.credit_note_id,
        created_at: txn.created_at,
        updated_at: txn.updated_at
      });
    });

    // 9. Apply credit notes, swap logic and attach asset_transactions
    deliveryChallans.forEach(dc => {
      const creditItems = creditNoteMap[dc.dispatch_order_id] || [];

      dc.items.forEach(item => {
        const originalDeviceIds = parseDeviceIds(item.device_ids);
        let updatedDeviceIds = [...originalDeviceIds];

        // Remove returned device IDs
        creditItems
          .filter(ci => ci.product_id === item.product_id)
          .forEach(ret => {
            const returnedIds = parseDeviceIds(ret.device_ids);
            updatedDeviceIds = updatedDeviceIds.filter(id => !returnedIds.includes(id));
          });

        // Remove swapped device IDs
        updatedDeviceIds = updatedDeviceIds.filter(id => !swappedDeviceIds.has(id));

        // Update item
        item.device_ids = updatedDeviceIds;
        item.quantity = updatedDeviceIds.length;
      });
    });

    // 10. FINAL CHALLAN FORMAT (YOUR REQUIRED FORMAT)
    const challans = deliveryChallans.map(dc => {
      const plain = dc.get({
        plain: true
      });
      delete plain.customer;

      plain.items = plain.items.map(item => {
        const deviceIds = item.device_ids || [];

        // Create EXACT required output format:
        const asset_transactions = deviceIds.map(deviceId => ({
          device_id: deviceId,
          transactions: assetTransactionsByDevice[deviceId] || []
        }));

        return {
          ...item,
          asset_transactions
        };
      });

      return plain;
    });

    // 11. Response
    res.status(200).json({
      customer: customer || null,
      challans
    });

  } catch (error) {
    console.error("Error fetching delivery challans:", error);
    res.status(500).json({
      message: "Error fetching delivery challans",
      error: error.message
    });
  }
};



// // Get Delivery Challans by Customer Code
// export const getDeliveryChallansByCustomerCode = async (req, res) => {
//   const { customer_code } = req.params;

//   // Helper to safely parse device_ids
//   function parseDeviceIds(deviceIdsRaw) {
//     if (!deviceIdsRaw) return [];
//     try {
//       const parsed = typeof deviceIdsRaw === 'string' ? JSON.parse(deviceIdsRaw) : deviceIdsRaw;
//       return Array.isArray(parsed) ? parsed : [];
//     } catch (err) {
//       console.warn('Invalid device_ids JSON in credit note:', deviceIdsRaw);
//       return [];
//     }
//   }

//   try {
//     // 1. Fetch delivery challans with items
//     const deliveryChallans = await DeliveryChallan.findAll({
//       where: { customer_code },
//       include: [
//         {
//           model: DeliveryChallanItem,
//           as: 'items',
//         }
//       ],
//       order: [['created_at', 'DESC']]
//     });

//     // 2. Get all dispatch_order_ids
//     const dispatchOrderIds = deliveryChallans.map(dc => dc.dispatch_order_id);

//     // 3. Fetch related credit notes and their items
//     const creditNotes = await CreditNote.findAll({
//       where: {
//         dispatch_order_id: dispatchOrderIds
//       },
//       include: [
//         {
//           model: CreditNoteItem,
//           as: 'items'
//         }
//       ]
//     });

//     // 4. Build credit note item map per dispatch_order_id
//     const creditNoteMap = {};
//     creditNotes.forEach(cn => {
//       if (!creditNoteMap[cn.dispatch_order_id]) {
//         creditNoteMap[cn.dispatch_order_id] = [];
//       }
//       creditNoteMap[cn.dispatch_order_id].push(...(cn.items || []));
//     });

//     // 5. Mutate each deliveryChallanItem's quantity & device_ids
//     for (const challan of deliveryChallans) {
//       const creditItems = creditNoteMap[challan.dispatch_order_id] || [];

//       for (const item of challan.items) {
//         const originalDeviceIds = parseDeviceIds(item.device_ids);
//         let updatedDeviceIds = [...originalDeviceIds];

//         const matchingReturns = creditItems.filter(
//           ci => ci.product_id === item.product_id
//         );

//         for (const ret of matchingReturns) {
//           const returnedIds = parseDeviceIds(ret.device_ids);
//           // Remove returned device_ids from current device_ids
//           updatedDeviceIds = updatedDeviceIds.filter(id => !returnedIds.includes(id));
//         }

//         // Set the filtered device_ids and updated quantity
//         item.device_ids = updatedDeviceIds;
//         item.quantity = updatedDeviceIds.length;
//       }
//     }

//     res.status(200).json(deliveryChallans);
//   } catch (error) {
//     console.error('Error fetching delivery challans by customer_code:', error);
//     res.status(500).json({ message: 'Error fetching delivery challans', error });
//   }
// };





export const getDeliveryChallansByCustomerCodePeripheralAssets = async (req, res) => {
  const { customer_code } = req.params;

  function parseDeviceIds(deviceIdsRaw) {
    if (!deviceIdsRaw) return [];
    try {
      const parsed = typeof deviceIdsRaw === "string" ? JSON.parse(deviceIdsRaw) : deviceIdsRaw;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return deviceIdsRaw.split(",").map((id) => id.trim()).filter((id) => id);
    }
  }

  try {
    // ✅ Step 1: Get peripheral challans (non-default)
    const challans = await DeliveryChallan.findAll({
      where: {
        customer_code,
        peripheral_update: true,
        [Op.or]: [
          { defualt_dc: false },
          { defualt_dc: null },
        ],
      },
      attributes: ["id", "dc_id", "customer_code", "peripheral_update", "defualt_dc"],
    });

    if (!challans || challans.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No peripheral challans found for this customer",
        data: [],
        totalAvailableAssets: 0,
      });
    }

    const challanIds = challans.map((c) => c.id);

    // ✅ Step 2: Fetch challan items with product details
    const challanItems = await DeliveryChallanItem.findAll({
      where: {
        challan_id: challanIds
      },
      include: [{
        model: ProductTemplete,
        as: "product",
        attributes: [
          "id",
          "product_name",
          "product_category",
          "ram",
          "storage",
          "disk_type",
          "brand",
          "model",
          "purchase_price",
          "rent_price_per_month",
          "capacity",
        ],
      }],
    });

    if (!challanItems || challanItems.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No items found in peripheral challans",
        data: [],
        totalAvailableAssets: 0,
      });
    }

    // ✅ Step 3: Get ALL asset transactions (added + removed)
    const allAssetTransactions = await AssetTransaction.findAll({
      attributes: ["asset_id", "status", "created_at"],
      order: [["created_at", "DESC"]],
      raw: true,
    });

    // ✅ Step 4: Track latest status of each asset
    const latestStatus = {};
    for (const tx of allAssetTransactions) {
      if (!latestStatus[tx.asset_id]) {
        latestStatus[tx.asset_id] = tx.status;
      }
    }

    // ✅ Step 5: Track which assets are active (latest status = 'Added')
    const activeAssetIds = new Set(
      Object.keys(latestStatus).filter((id) => latestStatus[id] === "Added")
    );

    // ✅ Step 6: Also track assets that have ever been assigned
    const allAssignedAssetIds = new Set(Object.keys(latestStatus));

    // ✅ Step 7: Process each challan item
    const response = challanItems
      .map((item) => {
        const deviceIds = parseDeviceIds(item.device_ids);
        
        // Separate available and used assets
        const availableDeviceIds = deviceIds.filter(
          (deviceId) => !activeAssetIds.has(deviceId)
        );
        
        const usedDeviceIds = deviceIds.filter(
          (deviceId) => activeAssetIds.has(deviceId)
        );

        // Check if there are any assets that were never assigned (not in any transaction)
        const neverAssignedDeviceIds = deviceIds.filter(
          (deviceId) => !allAssignedAssetIds.has(deviceId)
        );

        return {
          id: item.id,
          challan_id: item.challan_id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          
          // Asset tracking arrays
          device_ids: availableDeviceIds,
          used_device_ids: usedDeviceIds,
          never_assigned_device_ids: neverAssignedDeviceIds,
          
          // Counts
          available_quantity: availableDeviceIds.length,
          used_quantity: usedDeviceIds.length,
          never_assigned_quantity: neverAssignedDeviceIds.length,
          total_quantity: deviceIds.length,
          
          // Status flags
          has_available_assets: availableDeviceIds.length > 0,
          all_assets_in_use: usedDeviceIds.length === deviceIds.length && deviceIds.length > 0,
          no_assets_assigned: neverAssignedDeviceIds.length === deviceIds.length && deviceIds.length > 0,
          
          created_at: item.created_at,
          updated_at: item.updated_at,
          
          product: item.product ? {
            id: item.product.id,
            product_name: item.product.product_name,
            product_category: item.product.product_category,
            ram: item.product.ram,
            storage: item.product.storage,
            disk_type: item.product.disk_type,
            brand: item.product.brand,
            model: item.product.model,
            purchase_price: item.product.purchase_price,
            rent_price_per_month: item.product.rent_price_per_month,
            capacity: item.product.capacity,
          } : null,
        };
      });

    // Calculate overall statistics
    const totalAvailableAssets = response.reduce((sum, item) => sum + item.available_quantity, 0);
    const totalUsedAssets = response.reduce((sum, item) => sum + item.used_quantity, 0);
    const totalNeverAssignedAssets = response.reduce((sum, item) => sum + item.never_assigned_quantity, 0);
    const hasAnyAvailableAssets = response.some(item => item.has_available_assets);

    // Filter to only show items with available assets (optional - remove this if you want to see all items)
    const filteredResponse = response.filter(item => item.has_available_assets);

    // Return appropriate response
    if (filteredResponse.length === 0 && response.length > 0) {
      return res.status(200).json({
        success: true,
        message: "All peripheral assets are currently in use. No available assets found.",
        data: response, // Return full data for debugging/information
        filteredData: filteredResponse,
        summary: {
          total_products: response.length,
          total_assets: totalAvailableAssets + totalUsedAssets + totalNeverAssignedAssets,
          available_assets: totalAvailableAssets,
          used_assets: totalUsedAssets,
          never_assigned_assets: totalNeverAssignedAssets,
          has_available_assets: false,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: filteredResponse.length > 0 
        ? `Found ${filteredResponse.length} product(s) with available assets` 
        : "No peripheral assets available",
      data: filteredResponse,
      full_data: response, // Optional: include full data for debugging
      summary: {
        total_products: response.length,
        total_assets: totalAvailableAssets + totalUsedAssets + totalNeverAssignedAssets,
        available_assets: totalAvailableAssets,
        used_assets: totalUsedAssets,
        never_assigned_assets: totalNeverAssignedAssets,
        has_available_assets: hasAnyAvailableAssets,
      },
    });
    
  } catch (error) {
    console.error("Error fetching peripheral assets:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
};


export const getDeliveryChallanById = async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Fetch delivery challan with items, products, and contact
    const deliveryChallan = await DeliveryChallan.findByPk(id, {
      include: [
        {
          model: DeliveryChallanItem,
          as: "items",
          include: [
            {
              model: ProductTemplete,
              as: "product",
            },
          ],
        },
        {
          model: DispatchOrder, // Include the DispatchOrder to get customer_code
          as: "dispatch_order", // Make sure this association exists
          include: [
            {
              model: Contact, // Include Contact through DispatchOrder
              as: "contact", // This should match the association in DispatchOrder model
            }
          ]
        },
        // Alternatively, if you have a direct association to Contact from DeliveryChallan
        // {
        //   model: Contact,
        //   as: "contact",
        // }
      ],
    });

    if (!deliveryChallan) {
      return res.status(404).json({
        message: "Delivery Challan not found"
      });
    }

    const deliveryChallanData = deliveryChallan.toJSON();

    // Step 2: Parse device_ids if needed (already handled in model's getter)
    const enrichedItems = deliveryChallanData.items.map((item) => {
      // Sequelize model getter already parses JSON
      return {
        ...item,
        device_ids: item.device_ids || [],
      };
    });

    // Step 3: Calculate totals
    const totalQuantity = enrichedItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
    const totalPrice = enrichedItems.reduce(
      (sum, item) => sum + parseFloat(item.total_price || 0),
      0
    );

    // Step 4: Extract contact details from dispatch_order
    let contactDetails = null;
    if (deliveryChallanData.dispatch_order && deliveryChallanData.dispatch_order.contact) {
      contactDetails = deliveryChallanData.dispatch_order.contact;
      
      // Parse address JSON if it exists
      if (contactDetails.address) {
        try {
          const addressObj = typeof contactDetails.address === 'string' 
            ? JSON.parse(contactDetails.address) 
            : contactDetails.address;
          contactDetails.address = addressObj;
        } catch (e) {
          console.error('Error parsing address JSON:', e);
        }
      }
    }

    // Step 5: Return response with contact details
    return res.status(200).json({
      ...deliveryChallanData,
      items: enrichedItems,
      totalQuantity,
      totalPrice,
      contact: contactDetails, // Add contact details to response
      customer_name: contactDetails ? 
        contactDetails.company_name || 
        `${contactDetails.first_name || ''} ${contactDetails.last_name || ''}`.trim() || 
        'Unknown Customer' : 
        'No Contact Found'
    });
  } catch (error) {
    console.error("Error fetching delivery challan:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update Delivery Challan
export const updateDeliveryChallan = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const file = req.file; // ✅ assuming you're using multer for uploads

    const {
      dc_id,
      dc_title,
      is_dc,
      order_id,
      customer_code,
      order_number,
      dispatch_order_number,
      dispatch_order_id,
      dc_date,
      dc_status,
      dealer_reference,
      email,
      gst_number,
      pan_number,
      remarks,
      dc_file,
      uploaded_dc, // still included to allow manual updates too
      type,
      payment_type,
      regular_dc,
      industry,
      shipping_ordered_by,
      shipping_phone_number,
      shipping_name,
      street,
      landmark,
      pincode,
      city,
      state,
      country,
      vehicle_number,
      delivery_person_name,
      delivery_person_phone_number,
      peripheral_update,
      receiver_name,
      receiver_phone_number,
      mouse,
      cable,
      bag,
      others,
      other_accessory,
      defualt_dc,
      mouse_qty,
      cable_qty,
      bag_qty,
      others_qty,
      items
    } = req.body;

    const deliveryChallan = await DeliveryChallan.findByPk(id);
    if (!deliveryChallan) {
      return res.status(404).json({
        message: "Delivery Challan not found"
      });
    }

    // ✅ Handle uploaded file
    let uploadedFile = uploaded_dc;
    if (file) {
      uploadedFile = file.filename; // save uploaded filename
    }

    // ✅ Convert comma-separated string → JSON array
    let parsedAccessories = other_accessory;
    if (typeof other_accessory === "string") {
      parsedAccessories = other_accessory
        .split(",")
        .map((acc) => acc.trim())
        .filter((acc) => acc.length > 0);
    }

    await deliveryChallan.update({
      dc_id,
      dc_title,
      is_dc,
      order_id,
      customer_code,
      order_number,
      dispatch_order_number,
      dispatch_order_id,
      dc_date,
      dc_status,
      dealer_reference,
      email,
      gst_number,
      pan_number,
      remarks,
      dc_file,
      uploaded_dc: uploadedFile, // ✅ store uploaded file name or existing value
      type,
      payment_type,
      regular_dc,
      industry,
      shipping_ordered_by,
      shipping_phone_number,
      shipping_name,
      street,
      landmark,
      pincode,
      city,
      state,
      country,
      vehicle_number,
      delivery_person_name,
      delivery_person_phone_number,
      peripheral_update,
      receiver_name,
      receiver_phone_number,
      mouse,
      cable,
      bag,
      others,
      other_accessory: parsedAccessories,
      defualt_dc,
      mouse_qty: mouse_qty || 0,
      cable_qty: cable_qty || 0,
      bag_qty: bag_qty || 0,
      others_qty: others_qty || 0,
      updated_at: new Date(),
    });

    // ✅ Replace items if present
    if (items && Array.isArray(items)) {
      await DeliveryChallanItem.destroy({
        where: {
          challan_id: id
        }
      });

      const formattedItems = items.map((item) => ({
        ...item,
        challan_id: id,
        device_ids: JSON.stringify(item.device_ids || []),
      }));

      await DeliveryChallanItem.bulkCreate(formattedItems);
    }

    res.status(200).json({
      message: "Delivery Challan updated successfully",
      deliveryChallan,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error updating delivery challan",
      error,
    });
  }
};



// Delete Delivery Challan
export const deleteDeliveryChallan = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const deliveryChallan = await DeliveryChallan.findByPk(id);
    if (!deliveryChallan) return res.status(404).json({
      message: 'Delivery Challan not found'
    });

    await DeliveryChallanItem.destroy({
      where: {
        challan_id: id
      }
    });
    await deliveryChallan.destroy();

    res.status(200).json({
      message: 'Delivery Challan and related items deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error deleting delivery challan',
      error
    });
  }
};