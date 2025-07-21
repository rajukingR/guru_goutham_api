import db from "../models/index.js";
import {
  Op
} from "sequelize";

const DispatchOrder = db.DispatchOrder;
const DispatchOrderItem = db.DispatchOrderItem;
const Contact = db.Contact;
const DeliveryChallan = db.DeliveryChallan;
const GRN = db.GRN;
const CreditNote = db.CreditNote;
const CreditNoteItem = db.CreditNoteItem;
// ✅ Create Dispatch Order with Items
export const createDispatchOrder = async (req, res) => {
  try {
    const {
      items,
      ...orderData
    } = req.body;

    const newOrder = await DispatchOrder.create(orderData);

    if (items && Array.isArray(items)) {
      const enrichedItems = items.map((item) => ({
        ...item,
        dispatch_order_id: newOrder.id,
      }));
      await DispatchOrderItem.bulkCreate(enrichedItems);
    }

    res.status(201).json({
      message: "Dispatch order created",
      order: newOrder
    });
  } catch (err) {
    console.error("Create error:", err);
    res.status(500).json({
      message: "Failed to create dispatch order",
      error: err.message
    });
  }
};

// ✅ Get All Dispatch Orders (with items)
export const getAllDispatchOrders = async (req, res) => {
  try {
    const orders = await DispatchOrder.findAll({
      include: [{
        model: DispatchOrderItem,
        as: "items"
      }],
      order: [
        ["id", "DESC"]
      ],
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch orders",
      error: err.message
    });
  }
};

export const getAllApprovedDispatchOrders = async (req, res) => {
  try {
    // Step 1: Get dispatch_order_ids from GRNs where grn_status = "Approved"
    const grnApprovedDispatchOrderIds = await GRN.findAll({
      attributes: ['dispatch_order_id'],
      where: {
        grn_status: "Approved"
      },
      raw: true,
    });

    const excludeIds = grnApprovedDispatchOrderIds.map(grn => grn.dispatch_order_id);

    // Step 2: Fetch Dispatch Orders excluding those with Approved GRNs
    const approvedOrders = await DispatchOrder.findAll({
      where: {
        dispatch_order_status: "Approved",
        id: {
          [Op.notIn]: excludeIds
        }, // Exclude these dispatch_order_ids
      },
      include: [{
          model: db.DispatchOrderItem,
          as: "items"
        },
        {
          model: db.Contact,
          as: "contact"
        }
      ],
      order: [
        ["id", "DESC"]
      ],
    });

    res.json(approvedOrders);
  } catch (err) {
    console.error("Error fetching approved dispatch orders:", err);
    res.status(500).json({
      message: "Failed to fetch approved dispatch orders",
      error: err.message,
    });
  }
};



export const getAllApprovedDispatchOrdersApprovedDC = async (req, res) => {
  try {
    // Step 1: Get dispatch_order_ids with approved GRNs
    const grnApprovedDispatchOrderIds = await GRN.findAll({
      attributes: ['dispatch_order_id'],
      where: {
        grn_status: "Approved"
      },
      raw: true,
    });

    const excludeIds = grnApprovedDispatchOrderIds.map(grn => grn.dispatch_order_id);

    // Step 2: Fetch dispatch orders with required associations
    const approvedOrders = await DispatchOrder.findAll({
      where: {
        dispatch_order_status: "Approved",
        id: {
          [Op.notIn]: excludeIds
        },
      },
      include: [{
          model: DispatchOrderItem,
          as: "items",
        },
        {
          model: Contact,
          as: "contact",
        },
        {
          model: DeliveryChallan,
          as: "delivery_challans",
          where: {
            dc_status: "Delivered"
          },
          required: true,
        },
      ],
      order: [
        ["id", "DESC"]
      ],
    });

    // Step 3: Subtract returned qty and devices from each item
    for (const order of approvedOrders) {
      // Fetch all CreditNoteItems for this dispatch order
      const creditNotes = await CreditNote.findAll({
        where: {
          dispatch_order_id: order.id
        },
        include: [{
          model: CreditNoteItem,
          as: 'items', // ✅ Correct alias here
        }, ],
      });


      let allReturnedItems = [];
      for (const creditNote of creditNotes) {
        for (const item of creditNote.items) { // ✅ Fixed alias here
          allReturnedItems.push({
            product_id: item.product_id,
            returned_quantity: item.quantity,
            returned_device_ids: item.device_ids || [],
          });
        }
      }


      // Apply subtraction to each DispatchOrderItem
      for (const item of order.items) {
        const matchedReturns = allReturnedItems.filter(ret => ret.product_id === item.product_id);

        let totalReturnedQty = 0;
        let returnedDeviceIds = [];

        for (const ret of matchedReturns) {
          totalReturnedQty += ret.returned_quantity;
          if (Array.isArray(ret.returned_device_ids)) {
            returnedDeviceIds.push(...ret.returned_device_ids);
          }
        }

        // Final updated values only
        item.dataValues.quantity = Math.max(0, item.quantity - totalReturnedQty);
        item.dataValues.device_ids = item.device_ids?.filter(id => !returnedDeviceIds.includes(id));
      }
    }

    res.json(approvedOrders);
  } catch (err) {
    console.error("Error fetching filtered dispatch orders:", err);
    res.status(500).json({
      message: "Failed to fetch filtered dispatch orders",
      error: err.message,
    });
  }
};



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

// ✅ Update Dispatch Order and Its Items
export const updateDispatchOrder = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const {
      items,
      ...orderData
    } = req.body;

    const order = await DispatchOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    await order.update(orderData);

    if (items && Array.isArray(items)) {
      await DispatchOrderItem.destroy({
        where: {
          dispatch_order_id: id
        }
      });
      const newItems = items.map((item) => ({
        ...item,
        dispatch_order_id: id,
      }));
      await DispatchOrderItem.bulkCreate(newItems);
    }

    res.json({
      message: "Dispatch order updated",
      order
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update order",
      error: err.message
    });
  }
};

// ✅ Delete Dispatch Order (and its items via cascade)
export const deleteDispatchOrder = async (req, res) => {
  try {
    const {
      id
    } = req.params;

    const order = await DispatchOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    await order.destroy();
    res.json({
      message: "Dispatch order deleted"
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete order",
      error: err.message
    });
  }
};