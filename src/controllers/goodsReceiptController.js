import db from '../models/index.js';

const GoodsReceipt = db.GoodsReceipt;
const GoodsReceiptItem = db.GoodsReceiptItem;

// Create a new Goods Receipt with Items
export const createGoodsReceipt = async (req, res) => {
  try {
    const {
      goods_receipt_id,
      vendor_invoice_number,
      purchase_order_id,
      supplier_id,
      purchase_order_status,
      goods_receipt_date,
      purchase_type,
      goods_receipt_status,
      description,
      items = []
    } = req.body;

    // Check if goods_receipt_id already exists
    const existing = await GoodsReceipt.findOne({ where: { goods_receipt_id } });
    if (existing) {
      return res.status(400).json({ message: "Goods Receipt ID already exists." });
    }

    // Create receipt
    const receipt = await GoodsReceipt.create({
      goods_receipt_id,
      vendor_invoice_number,
      purchase_order_id,
      supplier_id,
      purchase_order_status,
      goods_receipt_date,
      purchase_type,
      goods_receipt_status,
      description
    });

    // Bulk create items
    if (items.length > 0) {
      const receiptItems = items.map(item => ({
        goods_receipt_id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit,
        gst_percentage: item.gst_percentage,
        total_price: item.total_price
      }));
      await GoodsReceiptItem.bulkCreate(receiptItems);
    }

    res.status(201).json({ message: "Goods receipt created successfully", receipt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating goods receipt", error });
  }
};

// Get all Goods Receipts
export const getAllGoodsReceipts = async (req, res) => {
  try {
    const receipts = await GoodsReceipt.findAll({
      include: [{ model: GoodsReceiptItem, as: 'items' }]
    });
    res.status(200).json(receipts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching goods receipts", error });
  }
};

// Get a single Goods Receipt by ID
export const getGoodsReceiptById = async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await GoodsReceipt.findByPk(id, {
      include: [{ model: GoodsReceiptItem, as: 'items' }]
    });

    if (!receipt) return res.status(404).json({ message: "Goods receipt not found" });

    res.status(200).json(receipt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching goods receipt", error });
  }
};

// Update a Goods Receipt
export const updateGoodsReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vendor_invoice_number,
      purchase_order_status,
      goods_receipt_date,
      purchase_type,
      goods_receipt_status,
      description,
    } = req.body;

    const receipt = await GoodsReceipt.findByPk(id);
    if (!receipt) return res.status(404).json({ message: "Goods receipt not found" });

    await receipt.update({
      vendor_invoice_number,
      purchase_order_status,
      goods_receipt_date,
      purchase_type,
      goods_receipt_status,
      description,
      updated_at: new Date()
    });

    res.status(200).json({ message: "Goods receipt updated successfully", receipt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating goods receipt", error });
  }
};

// Delete a Goods Receipt and its items
export const deleteGoodsReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await GoodsReceipt.findByPk(id);

    if (!receipt) return res.status(404).json({ message: "Goods receipt not found" });

    await GoodsReceiptItem.destroy({ where: { goods_receipt_id: receipt.goods_receipt_id } });
    await receipt.destroy();

    res.status(200).json({ message: "Goods receipt and items deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting goods receipt", error });
  }
};
