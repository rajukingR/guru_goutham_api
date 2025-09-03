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
      payment_type: type === "Buy" ? type : "Rent",
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



// Get All Delivery Challans
export const getAllDeliveryChallans = async (req, res) => {
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
export const getDeliveryChallansByCustomerCode = async (req, res) => {
  const {
    customer_code
  } = req.params;

  // Helper to safely parse device_ids
  function parseDeviceIds(deviceIdsRaw) {
    if (!deviceIdsRaw) return [];
    try {
      const parsed = typeof deviceIdsRaw === 'string' ? JSON.parse(deviceIdsRaw) : deviceIdsRaw;
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Invalid device_ids JSON in credit note:', deviceIdsRaw);
      return [];
    }
  }

  try {
    // 1. Fetch delivery challans with items, filter order_sale_date != null
    let deliveryChallans = await DeliveryChallan.findAll({
      where: {
        customer_code,
        order_sale_date: {
          [Op.ne]: null
        } // ✅ only challans where order_sale_date is NOT null
      },
      include: [{
        model: DeliveryChallanItem,
        as: 'items',
      }],
      order: [
        ['created_at', 'DESC']
      ]
    });

    // 2. Filter out challans where peripheral_update = true
    deliveryChallans = deliveryChallans.filter(dc => !dc.peripheral_update);

    // 3. Get all dispatch_order_ids
    const dispatchOrderIds = deliveryChallans.map(dc => dc.dispatch_order_id);

    // 4. Fetch related credit notes and their items
    const creditNotes = await CreditNote.findAll({
      where: {
        dispatch_order_id: dispatchOrderIds
      },
      include: [{
        model: CreditNoteItem,
        as: 'items'
      }]
    });

    // 5. Build credit note item map per dispatch_order_id
    const creditNoteMap = {};
    creditNotes.forEach(cn => {
      if (!creditNoteMap[cn.dispatch_order_id]) {
        creditNoteMap[cn.dispatch_order_id] = [];
      }
      creditNoteMap[cn.dispatch_order_id].push(...(cn.items || []));
    });

    // 6. Mutate each deliveryChallanItem's quantity & device_ids
    for (const challan of deliveryChallans) {
      const creditItems = creditNoteMap[challan.dispatch_order_id] || [];

      for (const item of challan.items) {
        const originalDeviceIds = parseDeviceIds(item.device_ids);
        let updatedDeviceIds = [...originalDeviceIds];

        const matchingReturns = creditItems.filter(
          ci => ci.product_id === item.product_id
        );

        for (const ret of matchingReturns) {
          const returnedIds = parseDeviceIds(ret.device_ids);
          // Remove returned device_ids from current device_ids
          updatedDeviceIds = updatedDeviceIds.filter(id => !returnedIds.includes(id));
        }

        // Set the filtered device_ids and updated quantity
        item.device_ids = updatedDeviceIds;
        item.quantity = updatedDeviceIds.length;
      }
    }

    res.status(200).json(deliveryChallans);
  } catch (error) {
    console.error('Error fetching delivery challans by customer_code:', error);
    res.status(500).json({
      message: 'Error fetching delivery challans',
      error
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
    // 1. Fetch challans with items + product + customer
    let deliveryChallans = await DeliveryChallan.findAll({
      where: {
        customer_code
      },
      include: [{
          model: DeliveryChallanItem,
          as: 'items',
          include: [{
            model: ProductTemplete,
            as: 'product', // <-- relation to fetch product data
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
          ],
          required: false
        }
      ],
      order: [
        ['created_at', 'DESC']
      ]
    });

    // 2. Filter out challans where peripheral_update = true
    deliveryChallans = deliveryChallans.filter(dc => !dc.peripheral_update);

    // 3. Fetch related credit notes
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

    // 4. Adjust items (remove returned device_ids)
    for (const challan of deliveryChallans) {
      const creditItems = creditNoteMap[challan.dispatch_order_id] || [];

      for (const item of challan.items) {
        const originalDeviceIds = parseDeviceIds(item.device_ids);
        let updatedDeviceIds = [...originalDeviceIds];

        const matchingReturns = creditItems.filter(ci => ci.product_id === item.product_id);

        for (const ret of matchingReturns) {
          const returnedIds = parseDeviceIds(ret.device_ids);
          updatedDeviceIds = updatedDeviceIds.filter(id => !returnedIds.includes(id));
        }

        item.device_ids = updatedDeviceIds;
        item.quantity = updatedDeviceIds.length;
      }
    }

    // 5. Transform output: customer once, challans array separately
    let customer = null;
    if (deliveryChallans.length > 0) {
      customer = deliveryChallans[0].customer; // pick first one (all same)
    }

    const challans = deliveryChallans.map(dc => {
      const plain = dc.get({
        plain: true
      });
      delete plain.customer; // remove duplicate
      return plain;
    });

    res.status(200).json({
      customer,
      challans
    });

  } catch (error) {
    console.error('Error fetching delivery challans by customer_code:', error);
    res.status(500).json({
      message: 'Error fetching delivery challans',
      error
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
  const {
    customer_code
  } = req.params;

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
    // ✅ Step 1: Find challans with peripheral_update = true AND defualt_dc = true
    const challans = await DeliveryChallan.findAll({
      where: {
        customer_code,
        peripheral_update: true,
        [Op.or]: [{
            defualt_dc: false
          }, // keep false
          {
            defualt_dc: null
          } // keep null if column is nullable
        ]
      },
      attributes: ["id", "dc_id", "customer_code", "peripheral_update", "defualt_dc"],
    });

    if (!challans || challans.length === 0) {
      return res.status(200).json([]);
    }

    const challanIds = challans.map((c) => c.id);

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
          "capacity"
        ],
      }, ],
    });

    const response = challanItems.map((item) => ({
      id: item.id,
      challan_id: item.challan_id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      device_ids: parseDeviceIds(item.device_ids),
      created_at: item.created_at,
      updated_at: item.updated_at,

      product: item.product ?
        {
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
        } :
        null,
    }));

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching peripheral assets:", error);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
};


export const getDeliveryChallanById = async (req, res) => {
  try {
    const {
      id
    } = req.params;

    // Step 1: Fetch delivery challan with items and products
    const deliveryChallan = await DeliveryChallan.findByPk(id, {
      include: [{
        model: DeliveryChallanItem,
        as: "items",
        include: [{
          model: ProductTemplete,
          as: "product",
        }, ],
      }, ],
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

    // Step 4: Return response
    return res.status(200).json({
      ...deliveryChallanData,
      items: enrichedItems,
      totalQuantity,
      totalPrice,
    });
  } catch (error) {
    console.error("Error fetching delivery challan:", error);
    return res.status(500).json({
      message: "Internal server error",
      error,
    });
  }
};

// Update Delivery Challan
export const updateDeliveryChallan = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const {
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
      items
    } = req.body;

    const deliveryChallan = await DeliveryChallan.findByPk(id);
    if (!deliveryChallan) {
      return res.status(404).json({
        message: 'Delivery Challan not found'
      });
    }

    // ✅ Convert comma-separated string → JSON array
    let parsedAccessories = other_accessory;
    if (typeof other_accessory === "string") {
      parsedAccessories = other_accessory
        .split(",")
        .map(acc => acc.trim())
        .filter(acc => acc.length > 0);
    }

    await deliveryChallan.update({
      dc_title,
      is_dc,
      order_id,
      customer_code,
      order_number,
      dispatch_order_number,
      dispatch_order_id: order_id, // 🔎 check: do you want req.body.dispatch_order_id instead?
      dc_date,
      dc_status,
      dealer_reference,
      email,
      gst_number,
      pan_number,
      remarks,
      dc_file,
      type,
      payment_type: type === "Buy" ? type : "Rent",
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
      other_accessory: parsedAccessories, // ✅ Save as JSON
      defualt_dc,
      updated_at: new Date()
    });

    // ✅ Replace items if present
    if (items && Array.isArray(items)) {
      await DeliveryChallanItem.destroy({
        where: {
          challan_id: id
        }
      });

      const formattedItems = items.map(item => ({
        ...item,
        challan_id: id,
        device_ids: JSON.stringify(item.device_ids || [])
      }));

      await DeliveryChallanItem.bulkCreate(formattedItems);
    }

    res.status(200).json({
      message: 'Delivery Challan updated successfully',
      deliveryChallan
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error updating delivery challan',
      error
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