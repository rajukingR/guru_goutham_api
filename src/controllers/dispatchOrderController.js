import db from "../models/index.js";
import {
  Op
} from "sequelize";

const DispatchOrder = db.DispatchOrder;
const DispatchOrderItem = db.DispatchOrderItem;
const Contact = db.Contact;
const DeliveryChallan = db.DeliveryChallan;
const DeliveryChallanItem = db.DeliveryChallanItem;

const GRN = db.GRN;
const CreditNote = db.CreditNote;
const CreditNoteItem = db.CreditNoteItem;
const OrderAddress = db.OrderAddress;
const AssetSwap = db.AssetSwap;
const Quotation = db.Quotation;
const QuotationItem = db.QuotationItem;

// ✅ Create Dispatch Order with Items
export const createDispatchOrder = async (req, res) => {
  try {
    const {
      items,
      is_direct_invoice,
      dispatch_order_date,
      customer_code,
      order_id,
      order_number,
      shipping_name,
      shipping_ordered_by,
      shipping_phone_number,
      street,
      landmark,
      pincode,
      city,
      state,
      country,
      gst_number,
      pan_number,
      payment_type,
      type,
      transaction_type,
      email,
      dealer_reference,
      remarks,
      industry,
      regular_dispatch_order,
      peripheral_update,
      dispatch_order_id,
      ...orderData
    } = req.body;


    // 1. Read values from req.body safely
    let currentStatus = req.body.dispatch_order_status;
    let updatedIsActive = req.body.is_active;

    // 2. If status is provided → update is_active
    if (currentStatus === "Approved") {
      updatedIsActive = true;
    }
    if (currentStatus === "Pending") {
      updatedIsActive = false;
    }


    // Create Dispatch Order
    const newOrder = await DispatchOrder.create({
      ...orderData,
      dispatch_order_id,
      dispatch_order_date,
      customer_code,
      order_id,
      order_number,
      shipping_name,
      shipping_ordered_by,
      shipping_phone_number,
      street,
      landmark,
      pincode,
      city,
      state,
      country,
      gst_number,
      pan_number,
      payment_type,
      type: type || transaction_type,
      email,
      dealer_reference,
      remarks,
      industry,
      regular_dispatch_order,
      peripheral_update,
      is_active: updatedIsActive,
      is_direct_invoice: is_direct_invoice || false // Make sure this is set in DispatchOrder
    });

    // Create Dispatch Order Items
    if (items && Array.isArray(items)) {
      const enrichedItems = items.map((item) => ({
        ...item,
        dispatch_order_id: newOrder.id,
      }));
      await DispatchOrderItem.bulkCreate(enrichedItems);
    }

    let deliveryChallan = null;

    // ✅ AUTO-CREATE DELIVERY CHALLAN if is_direct_invoice is true
    if (is_direct_invoice) {
      console.log("Creating Delivery Challan because is_direct_invoice is true"); // Debug log

      // Generate DC ID
      const dc_id = `DC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      // Create Delivery Challan
      deliveryChallan = await DeliveryChallan.create({
        dc_id: dc_id,
        dc_title: "",
        is_dc: true,
        order_id: order_id,
        dispatch_order_id: newOrder.id, // Link to the newly created dispatch order
        dispatch_order_number: dispatch_order_id,
        customer_code: customer_code,
        order_number: order_number,
        dc_date: dispatch_order_date,
        dc_status: "Delivered",
        dealer_reference: dealer_reference || "",
        email: email,
        gst_number: gst_number || "",
        pan_number: pan_number || "",
        remarks: remarks || "",
        type: type || transaction_type,
        payment_type: payment_type,
        regular_dc: regular_dispatch_order,
        industry: industry || "",
        shipping_ordered_by: shipping_ordered_by,
        shipping_phone_number: shipping_phone_number,
        shipping_name: shipping_name,
        street: street,
        landmark: landmark || "",
        pincode: pincode,
        city: city,
        state: state,
        country: country,
        peripheral_update: peripheral_update || false,
        is_direct_invoice: is_direct_invoice || false,
        vehicle_number: "",
        delivery_person_name: "",
        delivery_person_phone_number: "",
        receiver_name: "",
        receiver_phone_number: "",
        other_accessory: "",
        mouse: false,
        cable: false,
        bag: false,
        defualt_dc: false,
        others: false
      });

      // Create Delivery Challan Items
      // Create Delivery Challan Items
      if (items && Array.isArray(items)) {
        const challanItems = items.map(item => {
          // ✅ Fallback logic for prices
          const finalPurchasePrice =
            parseFloat(item.offer_purchase_price) > 0 ?
            parseFloat(item.offer_purchase_price) :
            parseFloat(item.purchase_price);

          const finalRentPrice =
            parseFloat(item.offer_rent_price_per_month) > 0 ?
            parseFloat(item.offer_rent_price_per_month) :
            parseFloat(item.rent_price_per_month);

          return {
            challan_id: deliveryChallan.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: finalRentPrice, // ✅ Always rent price
            total_price: finalPurchasePrice, // ✅ Always purchase price
            device_ids: item.device_ids || []
          };
        });

        await DeliveryChallanItem.bulkCreate(challanItems);
      }

    }

    const response = {
      message: "Dispatch order created successfully",
      order: newOrder
    };

    if (deliveryChallan) {
      response.message += " and Delivery Challan created automatically";
      response.delivery_challan = deliveryChallan;
    }

    res.status(201).json(response);

  } catch (err) {
    console.error("Create Dispatch Order error:", err);
    res.status(500).json({
      message: "Failed to create dispatch order",
      error: err.message
    });
  }
};

export const getAllDispatchOrders = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    //------------------------------------
    // SEARCH CONDITION
    //------------------------------------

    const whereCondition = search
      ? {
          [Op.or]: [
            { dispatch_order_id: { [Op.like]: `%${search}%` } },
            { shipping_name: { [Op.like]: `%${search}%` } },
            { shipping_phone_number: { [Op.like]: `%${search}%` } },
            { order_number: { [Op.like]: `%${search}%` } },
            { city: { [Op.like]: `%${search}%` } },
            { state: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    //------------------------------------

    const { count, rows } = await DispatchOrder.findAndCountAll({
      where: whereCondition,

      include: [
        {
          model: DispatchOrderItem,
          as: "items",
        },
      ],

      order: [["id", "DESC"]],
      limit,
      offset,
    });

    res.status(200).json({
      data: rows,
      totalRecords: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });

  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch dispatch orders",
      error: err.message,
    });
  }
};




// export const getAllDispatchOrders = async (req, res) => {
//   try {
//     const { role_name, id } = req.user;

//     let orders;

//     if (role_name === "Admin") {
//       // ⭐ Admin → all dispatch orders
//       orders = await DispatchOrder.findAll({
//         include: [
//           { model: DispatchOrderItem, as: "items" },
//           { model: Contact, as: "contact" },
//         ],
//         order: [["id", "DESC"]],
//       });

//     } else {
//       // ⭐ Non-admin → only orders where Contact.superior_id = login user
//       orders = await DispatchOrder.findAll({
//         include: [
//           { model: DispatchOrderItem, as: "items" },
//           {
//             model: Contact,
//             as: "contact",
//             required: true,
//             where: { superior_id: id }, // ⭐ FILTER HERE
//           },
//         ],
//         order: [["id", "DESC"]],
//       });
//     }

//     res.json(orders);

//   } catch (err) {
//     res.status(500).json({
//       message: "Failed to fetch orders",
//       error: err.message,
//     });
//   }
// };


export const getAllApprovedDispatchOrders = async (req, res) => {
  try {
    // Step 1: Get dispatch_order_ids from Delivery Challans where dc_status = "Delivered"
    const deliveredDeliveryChallanOrderIds = await DeliveryChallan.findAll({
      attributes: ["order_id"],
      where: {
        dc_status: "Delivered",
      },
      raw: true,
    });

    // Get only the order_ids to exclude
    const excludeIds = deliveredDeliveryChallanOrderIds.map(
      (dc) => dc.order_id
    );

    // Step 2: Fetch Dispatch Orders excluding those with Delivered Delivery Challans
    const approvedOrders = await DispatchOrder.findAll({
      where: {
        dispatch_order_status: "Approved",
        is_direct_invoice: 0, // ✅ Only non-direct invoices
        id: {
          [Op.notIn]: excludeIds,
        },
      },
      include: [{
          model: db.DispatchOrderItem,
          as: "items",
        },
        {
          model: db.Contact,
          as: "contact",
        },
        {
          model: db.OrderAddress,
          as: "order_address",
        },
      ],
      order: [
        ["id", "DESC"]
      ],
    });

    // Step 3: Exclude Buy orders where peripheral_update = 0
    const filteredOrders = approvedOrders.filter(
      (order) => !(order.type === "Buy" && order.peripheral_update === 0)
    );

    // Step 4: Map shipping address
    const enrichedOrders = filteredOrders.map((order) => {
      const o = order.toJSON();

      o.address = {
        zip: o.order_address?.shipping_pincode || o.pincode,
        city: o.order_address?.shipping_city || o.city,
        state: o.order_address?.shipping_state || o.state,
        street: (o.order_address?.shipping_street || "") +
          (o.order_address?.shipping_landmark ?
            ", " + o.order_address.shipping_landmark :
            o.street || o.landmark || ""),
        country: o.order_address?.shipping_country || o.country,
        pincode: o.order_address?.shipping_pincode || o.pincode,
      };

      delete o.order_address;
      return o;
    });

    res.json(enrichedOrders);
  } catch (err) {
    console.error("Error fetching approved dispatch orders:", err);
    res.status(500).json({
      message: "Failed to fetch approved dispatch orders",
      error: err.message,
    });
  }
};





/// 22-07-25




// export const getAllApprovedDispatchOrdersApprovedDC = async (req, res) => {
//   try {
//     // Step 1: Get dispatch_order_ids with approved GRNs
//     const grnApprovedDispatchOrderIds = await GRN.findAll({
//       attributes: ['dispatch_order_id'],
//       where: {
//         grn_status: "Approved"
//       },
//       raw: true,
//     });

//     const excludeIds = grnApprovedDispatchOrderIds.map(grn => grn.dispatch_order_id);

//     // Step 2: Fetch dispatch orders with required associations
//     const approvedOrders = await DispatchOrder.findAll({
//       where: {
//         dispatch_order_status: "Approved",
//         id: {
//           [Op.notIn]: excludeIds
//         },
//       },
//       include: [{
//           model: DispatchOrderItem,
//           as: "items",
//         },
//         {
//           model: Contact,
//           as: "contact",
//         },
//         {
//           model: DeliveryChallan,
//           as: "delivery_challans",
//           where: {
//             dc_status: "Delivered"
//           },
//           required: true,
//         },
//       ],
//       order: [
//         ["id", "DESC"]
//       ],
//     });

//     // Step 3: Subtract returned qty and devices from each item
//     for (const order of approvedOrders) {
//       // Fetch all CreditNoteItems for this dispatch order
//       const creditNotes = await CreditNote.findAll({
//         where: {
//           dispatch_order_id: order.id
//         },
//         include: [{
//           model: CreditNoteItem,
//           as: 'items', // ✅ Correct alias here
//         }, ],
//       });


//       let allReturnedItems = [];
//       for (const creditNote of creditNotes) {
//         for (const item of creditNote.items) { // ✅ Fixed alias here
//           allReturnedItems.push({
//             product_id: item.product_id,
//             returned_quantity: item.quantity,
//             returned_device_ids: item.device_ids || [],
//           });
//         }
//       }


//       // Apply subtraction to each DispatchOrderItem
//       for (const item of order.items) {
//         const matchedReturns = allReturnedItems.filter(ret => ret.product_id === item.product_id);

//         let totalReturnedQty = 0;
//         let returnedDeviceIds = [];

//         for (const ret of matchedReturns) {
//           totalReturnedQty += ret.returned_quantity;
//           if (Array.isArray(ret.returned_device_ids)) {
//             returnedDeviceIds.push(...ret.returned_device_ids);
//           }
//         }

//         // Final updated values only
//         item.dataValues.quantity = Math.max(0, item.quantity - totalReturnedQty);
//         item.dataValues.device_ids = item.device_ids?.filter(id => !returnedDeviceIds.includes(id));
//       }
//     }

//     res.json(approvedOrders);
//   } catch (err) {
//     console.error("Error fetching filtered dispatch orders:", err);
//     res.status(500).json({
//       message: "Failed to fetch filtered dispatch orders",
//       error: err.message,
//     });
//   }
// };



// export const getAllApprovedDispatchOrdersApprovedDC = async (req, res) => {
//   try {
//     const grnApprovedDispatchOrderIds = await GRN.findAll({
//       attributes: ["dispatch_order_id"],
//       where: { grn_status: "Approved" },
//       raw: true,
//     });
//     const excludeIds = grnApprovedDispatchOrderIds.map(
//       (grn) => grn.dispatch_order_id
//     );

//     // Step 2: Fetch ALL Approved Dispatch Orders
//     const allApprovedOrders = await DispatchOrder.findAll({
//       where: {
//         dispatch_order_status: "Approved",
//         id: { [Op.notIn]: excludeIds },
//       },
//       include: [
//         { model: DispatchOrderItem, as: "items" },
//         { model: Contact, as: "contact" },
//         { model: DeliveryChallan, as: "delivery_challans", required: false },
//       ],
//       order: [["id", "DESC"]],
//     });

//     // Step 3: Filter logic
//     const latestRentPerCustomer = {}; // key: customerCode+payment_type
//     const buyOrders = [];

//     for (const order of allApprovedOrders) {
//       if (order.convert_rent_to_sale === "Buy") {
//         // ✅ Buy → only peripheral_update = false
//         if (order.peripheral_update === false) {
//           order.dataValues.type = "Buy"; // override only for Buy
//           buyOrders.push(order);
//         }
//       } else {
//         // ✅ Rent → must check delivery challans
//         const hasValidDC = order.delivery_challans?.some(
//           (dc) =>
//             dc.dc_status === "Delivered" &&
//             dc.peripheral_update === false &&
//             dc.defualt_dc === false
//         );

//         if (hasValidDC) {
//           const customerCode = order.customer_code || order.contact?.id;
//           const paymentType = order.payment_type || "Unknown";
//           const key = `${customerCode}_${paymentType}`;

//           if (!latestRentPerCustomer[key]) {
//             // ⚠️ do NOT overwrite DB column type
//             // keep DB value as is
//             latestRentPerCustomer[key] = order;
//           }
//         }
//       }
//     }

//     // Combine Rent + Buy
//     const combinedOrders = [
//       ...Object.values(latestRentPerCustomer),
//       ...buyOrders,
//     ];

//     // Step 4: Subtract returned qty/device_ids for each order
//     for (const order of combinedOrders) {
//       const creditNotes = await CreditNote.findAll({
//         where: { dispatch_order_id: order.id },
//         include: [{ model: CreditNoteItem, as: "items" }],
//       });

//       const allReturnedItems = [];
//       for (const creditNote of creditNotes) {
//         for (const item of creditNote.items) {
//           allReturnedItems.push({
//             product_id: item.product_id,
//             returned_quantity: item.quantity,
//             returned_device_ids: item.device_ids || [],
//           });
//         }
//       }

//       for (const item of order.items) {
//         const matchedReturns = allReturnedItems.filter(
//           (ret) => ret.product_id === item.product_id
//         );

//         let totalReturnedQty = 0;
//         let returnedDeviceIds = [];

//         for (const ret of matchedReturns) {
//           totalReturnedQty += ret.returned_quantity;
//           if (Array.isArray(ret.returned_device_ids)) {
//             returnedDeviceIds.push(...ret.returned_device_ids);
//           }
//         }

//         item.dataValues.quantity = Math.max(0, item.quantity - totalReturnedQty);
//         item.dataValues.device_ids = item.device_ids?.filter(
//           (id) => !returnedDeviceIds.includes(id)
//         );
//       }
//     }

//     // Final sort by ID DESC
//     const sortedCombinedOrders = combinedOrders.sort((a, b) => b.id - a.id);

//     res.json(sortedCombinedOrders);
//   } catch (err) {
//     console.error("Error fetching dispatch orders:", err);
//     res.status(500).json({
//       message: "Failed to fetch filtered dispatch orders",
//       error: err.message,
//     });
//   }
// };




export const getAllApprovedDispatchOrdersApprovedDC = async (req, res) => {
  try {
    // Step 1: Fetch ALL Approved Dispatch Orders (no GRN exclusion)
    const allApprovedOrders = await DispatchOrder.findAll({
      where: {
        dispatch_order_status: "Approved",
      },
      include: [{
          model: DispatchOrderItem,
          as: "items"
        },
        {
          model: Contact,
          as: "contact"
        },
        {
          model: DeliveryChallan,
          as: "delivery_challans",
          required: false
        },
      ],
      order: [
        ["id", "DESC"]
      ],
    });

    // Step 2: Fetch Approved Direct Invoices from Quotations
    const directInvoiceQuotations = await Quotation.findAll({
      where: {
        is_direct_invoice: 1,
        status: "Approved",
      },
      include: [{
          model: QuotationItem,
          as: "items"
        },
        {
          model: Contact,
          as: "customer",
          required: false
        },
      ],
      order: [
        ["id", "DESC"]
      ],
    });

    // Step 3: Apply filter logic to DispatchOrders
    const latestRentPerCustomer = {}; // key: customerCode+payment_type
    const buyOrders = [];

    for (const order of allApprovedOrders) {
      if (order.convert_rent_to_sale === "Buy") {
        if (order.peripheral_update === false) {
          order.dataValues.type = "Buy";
          buyOrders.push(order);
        }
      } else {
        const hasValidDC = order.delivery_challans?.some(
          (dc) =>
          dc.dc_status === "Delivered" &&
          dc.peripheral_update === false &&
          dc.defualt_dc === false
        );

        if (hasValidDC) {
          const customerCode = order.customer_code || order.contact?.id;
          const paymentType = order.payment_type || "Unknown";
          const key = `${customerCode}_${paymentType}`;

          if (!latestRentPerCustomer[key]) {
            latestRentPerCustomer[key] = order;
          }
        }
      }
    }

    // Step 4: Adjust DispatchOrders with Credit Notes + Asset Swaps
    const combinedOrders = [
      ...Object.values(latestRentPerCustomer),
      ...buyOrders,
    ];

    for (const order of combinedOrders) {
      // --- 4.1 Handle Credit Notes ---
      const creditNotes = await CreditNote.findAll({
        where: {
          dispatch_order_id: order.id
        },
        include: [{
          model: CreditNoteItem,
          as: "items"
        }],
      });

      const allReturnedItems = [];
      for (const creditNote of creditNotes) {
        for (const item of creditNote.items) {
          allReturnedItems.push({
            product_id: item.product_id,
            returned_quantity: item.quantity,
            returned_device_ids: item.device_ids || [],
          });
        }
      }

      // --- 4.2 Handle Asset Swaps ---
      const assetSwaps = await AssetSwap.findAll({
        where: {
          product_id: {
            [Op.in]: order.items.map((i) => i.product_id)
          },
        },
      });

      const swappedItems = assetSwaps.map((swap) => ({
        product_id: swap.product_id,
        swapped_asset_id: swap.asset_id,
      }));

      // --- 4.3 Apply Adjustments per Item ---
      for (const item of order.items) {
        // Credit Notes
        const matchedReturns = allReturnedItems.filter(
          (ret) => ret.product_id === item.product_id
        );

        let totalReturnedQty = 0;
        let returnedDeviceIds = [];

        for (const ret of matchedReturns) {
          totalReturnedQty += ret.returned_quantity;
          if (Array.isArray(ret.returned_device_ids)) {
            returnedDeviceIds.push(...ret.returned_device_ids);
          }
        }

        // Subtract returned qty & devices
        item.dataValues.quantity = Math.max(0, item.quantity - totalReturnedQty);
        item.dataValues.device_ids = item.device_ids?.filter(
          (id) => !returnedDeviceIds.includes(id)
        );

        // Asset Swaps: subtract swapped asset_ids
        const matchedSwaps = swappedItems.filter(
          (s) => s.product_id === item.product_id
        );

        if (matchedSwaps.length > 0) {
          const swappedAssetIds = matchedSwaps.map((s) => s.swapped_asset_id);
          item.dataValues.device_ids = item.dataValues.device_ids?.filter(
            (id) => !swappedAssetIds.includes(id)
          );
          item.dataValues.quantity = Math.max(
            0,
            item.dataValues.device_ids?.length || 0
          );
        }

        // --- 4.4 ✅ Final device-based quantity correction ---
        if (!item.dataValues.device_ids || item.dataValues.device_ids.length === 0) {
          item.dataValues.quantity = 0;
        } else {
          item.dataValues.quantity = item.dataValues.device_ids.length;
        }
      }
    }

    // Step 5: Merge Quotations (direct invoices) into result
    const formattedQuotations = directInvoiceQuotations.map((q) => {
      return {
        ...q.get({
          plain: true
        }),
        type: "DirectInvoice",
      };
    });

    // Step 6: Final sort by ID DESC
    const sortedCombinedOrders = [...combinedOrders, ...formattedQuotations].sort(
      (a, b) => b.id - a.id
    );

    res.json(sortedCombinedOrders);
  } catch (err) {
    console.error("Error fetching dispatch orders:", err);
    res.status(500).json({
      message: "Failed to fetch filtered dispatch orders",
      error: err.message,
    });
  }
};





// export const getAllApprovedDispatchOrdersApprovedDC = async (req, res) => {
//   try {
//     const { role_name, id } = req.user;

//     // Step 1: Get GRN-approved DispatchOrder IDs
//     const grnApprovedDispatchOrderIds = await GRN.findAll({
//       attributes: ["dispatch_order_id"],
//       where: { grn_status: "Approved" },
//       raw: true,
//     });
//     const excludeIds = grnApprovedDispatchOrderIds.map(
//       (grn) => grn.dispatch_order_id
//     );

//     let allApprovedOrders;

//     if (role_name === "Admin") {
//       // ⭐ ADMIN: get ALL approved dispatch orders
//       allApprovedOrders = await DispatchOrder.findAll({
//         where: {
//           dispatch_order_status: "Approved",
//           id: { [Op.notIn]: excludeIds },
//         },
//         include: [
//           { model: DispatchOrderItem, as: "items" },
//           { model: Contact, as: "contact" },
//           { model: DeliveryChallan, as: "delivery_challans", required: false },
//         ],
//         order: [["id", "DESC"]],
//       });

//     } else {
//       // ⭐ NON-ADMIN: filter by Contact.superior_id
//       allApprovedOrders = await DispatchOrder.findAll({
//         where: {
//           dispatch_order_status: "Approved",
//           id: { [Op.notIn]: excludeIds },
//         },
//         include: [
//           { model: DispatchOrderItem, as: "items" },
//           {
//             model: Contact,
//             as: "contact",
//             required: true,
//             where: { superior_id: id },  // ⭐ IMPORTANT FILTER HERE
//           },
//           { model: DeliveryChallan, as: "delivery_challans", required: false },
//         ],
//         order: [["id", "DESC"]],
//       });
//     }

//     // ⭐ EVERYTHING BELOW REMAINS EXACTLY AS YOU WROTE
//     // Step 3: Fetch Approved Direct Invoices from Quotations
//     const directInvoiceQuotations = await Quotation.findAll({
//       where: {
//         is_direct_invoice: 1,
//         status: "Approved",
//       },
//       include: [
//         { model: QuotationItem, as: "items" },
//         { model: Contact, as: "customer", required: false },
//       ],
//       order: [["id", "DESC"]],
//     });

//     const latestRentPerCustomer = {}; 
//     const buyOrders = [];

//     for (const order of allApprovedOrders) {
//       if (order.convert_rent_to_sale === "Buy") {
//         if (order.peripheral_update === false) {
//           order.dataValues.type = "Buy";
//           buyOrders.push(order);
//         }
//       } else {
//         const hasValidDC = order.delivery_challans?.some(
//           (dc) =>
//             dc.dc_status === "Delivered" &&
//             dc.peripheral_update === false &&
//             dc.defualt_dc === false
//         );

//         if (hasValidDC) {
//           const customerCode = order.customer_code || order.contact?.id;
//           const paymentType = order.payment_type || "Unknown";
//           const key = `${customerCode}_${paymentType}`;

//           if (!latestRentPerCustomer[key]) {
//             latestRentPerCustomer[key] = order;
//           }
//         }
//       }
//     }

//     const combinedOrders = [
//       ...Object.values(latestRentPerCustomer),
//       ...buyOrders,
//     ];

//     for (const order of combinedOrders) {
//       const creditNotes = await CreditNote.findAll({
//         where: { dispatch_order_id: order.id },
//         include: [{ model: CreditNoteItem, as: "items" }],
//       });

//       const allReturnedItems = [];
//       for (const creditNote of creditNotes) {
//         for (const item of creditNote.items) {
//           allReturnedItems.push({
//             product_id: item.product_id,
//             returned_quantity: item.quantity,
//             returned_device_ids: item.device_ids || [],
//           });
//         }
//       }

//       const assetSwaps = await AssetSwap.findAll({
//         where: {
//           product_id: { [Op.in]: order.items.map((i) => i.product_id) },
//         },
//       });

//       const swappedItems = assetSwaps.map((swap) => ({
//         product_id: swap.product_id,
//         swapped_asset_id: swap.asset_id,
//       }));

//       for (const item of order.items) {
//         const matchedReturns = allReturnedItems.filter(
//           (ret) => ret.product_id === item.product_id
//         );

//         let totalReturnedQty = 0;
//         let returnedDeviceIds = [];

//         for (const ret of matchedReturns) {
//           totalReturnedQty += ret.returned_quantity;
//           if (Array.isArray(ret.returned_device_ids)) {
//             returnedDeviceIds.push(...ret.returned_device_ids);
//           }
//         }

//         item.dataValues.quantity = Math.max(0, item.quantity - totalReturnedQty);
//         item.dataValues.device_ids = item.device_ids?.filter(
//           (id) => !returnedDeviceIds.includes(id)
//         );

//         const matchedSwaps = swappedItems.filter(
//           (s) => s.product_id === item.product_id
//         );

//         if (matchedSwaps.length > 0) {
//           const swappedAssetIds = matchedSwaps.map((s) => s.swapped_asset_id);
//           item.dataValues.device_ids = item.dataValues.device_ids?.filter(
//             (id) => !swappedAssetIds.includes(id)
//           );
//           item.dataValues.quantity = item.dataValues.device_ids?.length || 0;
//         }

//         if (!item.dataValues.device_ids || item.dataValues.device_ids.length === 0) {
//           item.dataValues.quantity = 0;
//         } else {
//           item.dataValues.quantity = item.dataValues.device_ids.length;
//         }
//       }
//     }

//     const formattedQuotations = directInvoiceQuotations.map((q) => ({
//       ...q.get({ plain: true }),
//       type: "DirectInvoice",
//     }));

//     const sortedCombinedOrders = [...combinedOrders, ...formattedQuotations].sort(
//       (a, b) => b.id - a.id
//     );

//     res.json(sortedCombinedOrders);

//   } catch (err) {
//     console.error("Error fetching dispatch orders:", err);
//     res.status(500).json({
//       message: "Failed to fetch filtered dispatch orders",
//       error: err.message,
//     });
//   }
// };




// ✅ Get Dispatch Order by ID
export const getDispatchOrderById = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const order = await DispatchOrder.findByPk(id, {
      include: [{
        model: DispatchOrderItem,
        as: "items"
      }],
    });

    if (!order) {
      return res.status(404).json({
        message: "Dispatch order not found"
      });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch order",
      error: err.message
    });
  }
};

// ✅ Update Dispatch Order and Its Items + Related Delivery Challans
export const updateDispatchOrder = async (req, res) => {
  try {
    const {
      id
    } = req.params; // numeric PK
    const {
      items,
      is_direct_invoice,
      dispatch_order_date,
      customer_code,
      order_id,
      order_number,
      shipping_name,
      shipping_ordered_by,
      shipping_phone_number,
      street,
      landmark,
      pincode,
      city,
      state,
      country,
      gst_number,
      pan_number,
      payment_type,
      type,
      transaction_type,
      email,
      dealer_reference,
      remarks,
      industry,
      regular_dispatch_order,
      peripheral_update,
      dispatch_order_id, // business ID like DC-XXXX
      convert_rent_to_sale,
      order_sale_date: bodyOrderSaleDate,
      ...orderData
    } = req.body;



    // 1. Read values from req.body safely
    let currentStatus = req.body.dispatch_order_status;
    let updatedIsActive = req.body.is_active;

    // 2. If status is provided → update is_active
    if (currentStatus === "Approved") {
      updatedIsActive = true;
    }
    if (currentStatus === "Pending") {
      updatedIsActive = false;
    }

    // 3. If is_active is provided → update status
    if (updatedIsActive === true) {
      currentStatus = "Approved";
    }
    if (updatedIsActive === false) {
      currentStatus = "Pending";
    }


    // ✅ Find order
    const order = await DispatchOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({
        message: "Dispatch order not found"
      });
    }

    // ✅ Decide order_sale_date
    let orderSaleDate = null;
    if (convert_rent_to_sale === "Buy") {
      orderSaleDate = bodyOrderSaleDate ?
        new Date(bodyOrderSaleDate).toISOString().split("T")[0] :
        new Date().toISOString().split("T")[0];
    }

    // ✅ Update Dispatch Order
    await order.update({
      ...orderData,
      dispatch_order_id,
      dispatch_order_date,
      dispatch_order_status: currentStatus, // ✔ always correct
      is_active: updatedIsActive,
      customer_code,
      order_id,
      order_number,
      shipping_name,
      shipping_ordered_by,
      shipping_phone_number,
      street,
      landmark,
      pincode,
      city,
      state,
      country,
      gst_number,
      pan_number,
      payment_type,
      type: type || transaction_type,
      email,
      dealer_reference,
      remarks,
      industry,
      regular_dispatch_order,
      peripheral_update,
      is_direct_invoice: is_direct_invoice || false,
      convert_rent_to_sale,
      order_sale_date: orderSaleDate,
    });

    // ✅ Replace Dispatch Order Items
    if (items && Array.isArray(items)) {
      await DispatchOrderItem.destroy({
        where: {
          dispatch_order_id: order.id
        }
      });
      const enrichedItems = items.map((item) => ({
        ...item,
        dispatch_order_id: order.id, // numeric FK
      }));
      await DispatchOrderItem.bulkCreate(enrichedItems);
    }

    let deliveryChallan = null;

    if (is_direct_invoice) {
      // ✅ Find existing Delivery Challan
      deliveryChallan = await DeliveryChallan.findOne({
        where: {
          dispatch_order_id: order.id
        },
      });

      if (deliveryChallan) {
        // Update challan
        await deliveryChallan.update({
          dc_date: dispatch_order_date,
          customer_code,
          order_number,
          order_id,
          dc_status: "Delivered",
          dealer_reference: dealer_reference || "",
          email,
          gst_number: gst_number || "",
          pan_number: pan_number || "",
          remarks: remarks || "",
          type: convert_rent_to_sale,
          payment_type,
          regular_dc: regular_dispatch_order,
          industry: industry || "",
          shipping_ordered_by,
          shipping_phone_number,
          shipping_name,
          street,
          landmark: landmark || "",
          pincode,
          city,
          state,
          country,
          peripheral_update: peripheral_update || false,
          is_direct_invoice: true,
          convert_rent_to_sale,
          order_sale_date: orderSaleDate,
        });

        // Replace challan items
        await DeliveryChallanItem.destroy({
          where: {
            challan_id: deliveryChallan.id
          }
        });
        if (items && Array.isArray(items)) {
          const challanItems = items.map((item) => ({
            challan_id: deliveryChallan.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.rent_price_per_month,
            total_price: item.total_price,
            device_ids: item.device_ids || [],
          }));
          await DeliveryChallanItem.bulkCreate(challanItems);
        }
      } else {
        // Create new challan
        const dc_id = `DC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        deliveryChallan = await DeliveryChallan.create({
          dc_id,
          dc_title: "",
          is_dc: true,
          order_id,
          dispatch_order_id: order.id, // numeric FK
          dispatch_order_number: order.dispatch_order_id, // business ID
          customer_code,
          order_number,
          dc_date: dispatch_order_date,
          dc_status: "Delivered",
          dealer_reference: dealer_reference || "",
          email,
          gst_number: gst_number || "",
          pan_number: pan_number || "",
          remarks: remarks || "",
          type: convert_rent_to_sale,
          payment_type: convert_rent_to_sale,
          regular_dc: regular_dispatch_order,
          industry: industry || "",
          shipping_ordered_by,
          shipping_phone_number,
          shipping_name,
          street,
          landmark: landmark || "",
          pincode,
          city,
          state,
          country,
          peripheral_update: peripheral_update || false,
          is_direct_invoice: true,
          convert_rent_to_sale,
          order_sale_date: orderSaleDate,
        });

        if (items && Array.isArray(items)) {
          const challanItems = items.map((item) => ({
            challan_id: deliveryChallan.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.rent_price_per_month,
            total_price: item.total_price,
            device_ids: item.device_ids || [],
          }));
          await DeliveryChallanItem.bulkCreate(challanItems);
        }
      }
    } else {
      // ❌ If not direct invoice → delete challan & items
      const existingChallan = await DeliveryChallan.findOne({
        where: {
          dispatch_order_id: order.id
        },
      });
      if (existingChallan) {
        await DeliveryChallanItem.destroy({
          where: {
            challan_id: existingChallan.id
          }
        });
        await existingChallan.destroy();
      }
    }

    const response = {
      message: "Dispatch order updated successfully",
      order,
    };

    if (deliveryChallan) {
      response.message += " and Delivery Challan synced";
      response.delivery_challan = deliveryChallan;
    }

    res.status(200).json(response);
  } catch (err) {
    console.error("Update Dispatch Order error:", err);
    res.status(500).json({
      message: "Failed to update dispatch order",
      error: err.message,
    });
  }
};








// ✅ Delete Dispatch Order (and its items via cascade)
export const deleteDispatchOrder = async (req, res) => {
  const transaction = await db.sequelize.transaction(); // ✅ use sequelize from db
  try {
    const {
      id
    } = req.params;

    const order = await DispatchOrder.findByPk(id, {
      transaction
    });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Order not found"
      });
    }

    // ✅ If this is a direct invoice, delete challans + challan items
    if (order.is_direct_invoice === true) {
      const challans = await DeliveryChallan.findAll({
        where: {
          dispatch_order_id: id,
          is_direct_invoice: true,
        },
        transaction,
      });

      for (const challan of challans) {
        // delete items first
        await DeliveryChallanItem.destroy({
          where: {
            challan_id: challan.id
          },
          transaction,
        });

        // then delete challan itself
        await challan.destroy({
          transaction
        });
      }
    }

    // ✅ Delete DispatchOrder (cascade should handle DispatchOrderItems)
    await order.destroy({
      transaction
    });

    await transaction.commit();
    res.json({
      message: "Dispatch order deleted (and related delivery challans + items deleted if direct invoice)",
    });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({
      message: "Failed to delete order",
      error: err.message,
    });
  }
};