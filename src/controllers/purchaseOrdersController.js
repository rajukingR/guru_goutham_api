// controllers/purchaseOrdersController.js
import db from '../models/index.js';

const PurchaseOrder = db.PurchaseOrder;

export const createPurchaseOrder = async (req, res) => {
  try {
    const {
      purchase_order_id,
      purchase_quotation_id,
      supplier_id,
      purchase_order_date,
      purchase_type,
      po_status,
      owner,
      description
    } = req.body;

    const newOrder = await PurchaseOrder.create({
      purchase_order_id,
      purchase_quotation_id,
      supplier_id,
      purchase_order_date,
      purchase_type,
      po_status,
      owner,
      description
    });

    res.status(201).json({ message: 'Purchase Order created successfully', order: newOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating purchase order', error });
  }
};

export const getAllPurchaseOrders = async (req, res) => {
  try {
    const orders = await PurchaseOrder.findAll();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching purchase orders', error });
  }
};

export const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await PurchaseOrder.findByPk(id);
    if (!order) return res.status(404).json({ message: 'Purchase order not found' });

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching purchase order', error });
  }
};

export const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await PurchaseOrder.findByPk(id);
    if (!order) return res.status(404).json({ message: 'Purchase order not found' });

    await order.destroy();
    res.status(200).json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting purchase order', error });
  }
};
