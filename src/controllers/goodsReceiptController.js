import db from '../models/index.js';

const GoodsReceipt = db.GoodsReceipt;
const GoodsReceiptItem = db.GoodsReceiptItem;
const Product = db.Product; 

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

    // Create main goods receipt
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

    // Bulk create receipt items with actual `receipt.id` as foreign key
    if (items.length > 0) {
      const receiptItems = items.map(item => ({
        goods_receipt_id: receipt.id, // ✅ Use the actual DB ID
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
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
      include: [{ model: GoodsReceiptItem, as: 'selected_products' }]
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
      include: [{ model: GoodsReceiptItem, as: 'selected_products' }]
    });

    if (!receipt) return res.status(404).json({ message: "Goods receipt not found" });

    res.status(200).json(receipt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching goods receipt", error });
  }
};


export const getApprovedProductSummary = async (req, res) => {
  try {
    // Step 1: Get all approved goods_receipt IDs
    const approvedReceipts = await GoodsReceipt.findAll({
      where: { goods_receipt_status: 'Approved' },
      attributes: ['id'],
    });

    const approvedReceiptIds = approvedReceipts.map(r => r.id);

    // Step 2: Get all items from approved receipts
    const receiptItems = await GoodsReceiptItem.findAll({
      where: { goods_receipt_id: approvedReceiptIds },
      attributes: ['product_id', 'quantity'],
    });

    // Step 3: Group by product_id and sum quantities
    const quantityMap = {};

    receiptItems.forEach(item => {
      const productId = item.product_id;
      const qty = item.quantity || 0;
      if (quantityMap[productId]) {
        quantityMap[productId] += qty;
      } else {
        quantityMap[productId] = qty;
      }
    });

    // Step 4: Fetch product details for each grouped product_id
    const result = await Promise.all(
      Object.entries(quantityMap).map(async ([productId, totalQty]) => {
        const product = await Product.findByPk(productId);
        return {
          product_id: productId,
          total_quantity: totalQty,
          product: product ? product.toJSON() : null,
        };
      })
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getApprovedProductSummary:", error);
    res.status(500).json({ message: "Internal server error", error });
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
