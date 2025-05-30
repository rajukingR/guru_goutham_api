// controllers/purchaseOrdersController.js
import db from '../models/index.js';

const PurchaseOrder = db.PurchaseOrder;
const Supplier = db.Supplier;
const PurchaseOrderItem = db.PurchaseOrderItem;
const Product = db.Product;

export const createPurchaseOrder = async (req, res) => {
  const t = await db.sequelize.transaction(); // start transaction
  try {
    const {
      purchase_order_id,
      purchase_quotation_id,
      supplier_id,
      purchase_order_date,
      purchase_type,
      po_status,
      owner,
      description,
      selected_products
    } = req.body;

    // Create the main order
    const newOrder = await PurchaseOrder.create({
      purchase_order_id,
      purchase_quotation_id,
      supplier_id,
      purchase_order_date,
      purchase_type,
      po_status,
      owner,
      description
    }, { transaction: t });

    // Insert associated product items
    if (selected_products && selected_products.length > 0) {
      const itemsData = selected_products.map(product => ({
        purchase_order_id: newOrder.id,
        product_id: product.product_id,
        quantity: product.quantity,
      }));

      await PurchaseOrderItem.bulkCreate(itemsData, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ message: 'Purchase Order and items created successfully', order: newOrder });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: 'Error creating purchase order', error });
  }
};

export const getAllPurchaseOrders = async (req, res) => {
  try {
    const orders = await PurchaseOrder.findAll({
      include: [
        {
          model: Supplier,
          as: 'supplier', // Association alias must match model setup
          attributes: ['supplier_id', 'supplier_name'],
        },
      ],
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    res.status(500).json({ message: 'Error fetching purchase orders', error });
  }
};

export const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await db.PurchaseOrder.findByPk(id, {
      include: [
        {
          model: db.PurchaseOrderItem,
          as: 'selected_products',
        },
         {
          model: db.Supplier,
          as: 'supplier',
          attributes: ['supplier_id', 'supplier_name']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching purchase order', error });
  }
};


export const getApprovedPurchaseOrders = async (req, res) => {
  try {
    const orders = await db.PurchaseOrder.findAll({
      where: {
        po_status: 'Approved', // Ensure this matches the status used in your DB
      },
      include: [
        {
          model: db.Supplier,
          as: 'supplier',
          attributes: ['supplier_name'],
        },
        {
          model: db.PurchaseOrderItem,
          as: 'selected_products',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['name', 'model'],
            }
          ]
        }
      ],
    });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No approved purchase orders found' });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching approved purchase orders:', error);
    res.status(500).json({ message: 'Server error', error });
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


export const updatePurchaseOrder = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params; // Get ID from URL

    const {
      purchase_order_id,
      purchase_quotation_id,
      supplier_id,
      purchase_order_date,
      purchase_type,
      po_status,
      owner,
      description,
      selected_products
    } = req.body;

    // Find existing purchase order by ID
    const existingOrder = await PurchaseOrder.findByPk(id);
    if (!existingOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    // Update main purchase order fields
    await existingOrder.update({
      purchase_order_id,
      purchase_quotation_id,
      supplier_id,
      purchase_order_date,
      purchase_type,
      po_status,
      owner,
      description
    }, { transaction: t });

    // Delete old purchase order items
    await PurchaseOrderItem.destroy({
      where: { purchase_order_id: existingOrder.id },
      transaction: t
    });

    // Insert new items
    if (selected_products && selected_products.length > 0) {
      const itemsData = selected_products.map(product => ({
        purchase_order_id: existingOrder.id,
        product_id: product.product_id,
        quantity: product.quantity
      }));

      await PurchaseOrderItem.bulkCreate(itemsData, { transaction: t });
    }

    await t.commit();
    res.status(200).json({ message: 'Purchase Order updated successfully', order: existingOrder });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: 'Error updating purchase order', error });
  }
};
