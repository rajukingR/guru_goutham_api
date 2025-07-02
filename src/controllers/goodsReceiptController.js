import db from '../models/index.js';

const {
  GoodsReceipt,
  GoodsReceiptItem,
  Order,
  OrderItem,
  ProductTemplete,
  DeliveryChallan,
  DeliveryChallanItem,
   Invoice,
  InvoiceItem,
} = db;

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

    // 1. Check if goods_receipt_id already exists
    const existing = await GoodsReceipt.findOne({
      where: {
        goods_receipt_id
      }
    });
    if (existing) {
      return res.status(400).json({
        message: "Goods Receipt ID already exists."
      });
    }

    // 2. Extract all incoming asset IDs
    const incomingAssetIds = items.flatMap(item => item.asset_ids || []);

    // 3. Fetch all existing asset_ids from DB
    const existingItems = await GoodsReceiptItem.findAll({
      attributes: ['asset_ids']
    });

    const existingAssetIds = [];
    for (const item of existingItems) {
      const ids = item.asset_ids || []; // thanks to your model getter, this is already parsed
      existingAssetIds.push(...ids);
    }

    // 4. Check for duplicates
    const duplicateIds = incomingAssetIds.filter(id => existingAssetIds.includes(id));
    if (duplicateIds.length > 0) {
      return res.status(400).json({
        message: "Duplicate asset IDs found.",
        duplicates: duplicateIds
      });
    }

    // 5. Create main goods receipt
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

    // 6. Create receipt items
    const receiptItems = items.map(item => ({
      goods_receipt_id: receipt.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      asset_ids: item.asset_ids || [],
    }));

    await GoodsReceiptItem.bulkCreate(receiptItems);

    res.status(201).json({
      message: "Goods receipt created successfully",
      receipt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error creating goods receipt",
      error
    });
  }
};



// Get all Goods Receipts
export const getAllGoodsReceipts = async (req, res) => {
  try {
    const receipts = await GoodsReceipt.findAll({
      include: [{
        model: GoodsReceiptItem,
        as: 'selected_products'
      }]
    });
    res.status(200).json(receipts);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching goods receipts",
      error
    });
  }
};

// Get a single Goods Receipt by ID
export const getGoodsReceiptById = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const receipt = await GoodsReceipt.findByPk(id, {
      include: [{
        model: GoodsReceiptItem,
        as: 'selected_products'
      }]
    });

    if (!receipt) return res.status(404).json({
      message: "Goods receipt not found"
    });

    res.status(200).json(receipt);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching goods receipt",
      error
    });
  }
};

export const getApprovedProductSummary = async (req, res) => {
  try {
    // 1. Get Approved Goods Receipts
    const approvedReceipts = await GoodsReceipt.findAll({
      where: { goods_receipt_status: 'Approved' },
      attributes: ['id'],
    });

    const approvedReceiptIds = approvedReceipts.map(r => r.id);
    if (approvedReceiptIds.length === 0) {
      return res.status(200).json({
        summary: {},
        products: []
      });
    }

    // 2. Get GoodsReceiptItems for approved receipts
    const receiptItems = await GoodsReceiptItem.findAll({
      where: { goods_receipt_id: approvedReceiptIds },
      attributes: ['product_id', 'quantity', 'asset_ids'],
    });

    const quantityMap = {};
    const assetMap = {};

    for (const item of receiptItems) {
      const productId = item.product_id;
      const qty = item.quantity || 0;
      const assets = Array.isArray(item.asset_ids) ? item.asset_ids : JSON.parse(item.asset_ids || '[]');

      quantityMap[productId] = (quantityMap[productId] || 0) + qty;
      if (!assetMap[productId]) assetMap[productId] = [];
      assetMap[productId].push(...assets);
    }

    // 3. Get all used and returned device IDs from InvoiceItems
    const invoiceItems = await InvoiceItem.findAll({
      attributes: ['product_id', 'device_ids', 'returned_device_ids']
    });

    const usedDeviceMap = {};
    const returnedDeviceMap = {};

    for (const item of invoiceItems) {
      const productId = item.product_id;

      // Used device IDs
      try {
        const usedIds = Array.isArray(item.device_ids) ? item.device_ids : JSON.parse(item.device_ids || '[]');
        if (!usedDeviceMap[productId]) usedDeviceMap[productId] = new Set();
        usedIds.forEach(id => usedDeviceMap[productId].add(id));
      } catch (err) {
        console.warn('Invalid device_ids JSON:', item.device_ids);
      }

      // Returned device IDs
      try {
        const returnedIds = Array.isArray(item.returned_device_ids) ? item.returned_device_ids : JSON.parse(item.returned_device_ids || '[]');
        if (!returnedDeviceMap[productId]) returnedDeviceMap[productId] = new Set();
        returnedIds.forEach(id => returnedDeviceMap[productId].add(id));
      } catch (err) {
        console.warn('Invalid returned_device_ids JSON:', item.returned_device_ids);
      }
    }

    // 4. Bulk fetch product details
    const productIds = Object.keys(quantityMap).map(Number);
    const productTemplates = await ProductTemplete.findAll({
      where: { id: productIds }
    });
    const productMap = Object.fromEntries(productTemplates.map(p => [p.id, p.toJSON()]));

    // 5. Final aggregation
    let totalUsedCount = 0;
    let grandTotalAmount = 0;

const result = productIds.map(productId => {
  const totalQty = quantityMap[productId];
  const allAssets = assetMap[productId] || [];

  const usedSet = usedDeviceMap[productId] || new Set();
  const returnedSet = returnedDeviceMap[productId] || new Set();

  // Reusable: (All - Used) + Returned
  const availableAssets = allAssets.filter(id => !usedSet.has(id) || returnedSet.has(id));

  // Net used quantity = Used - Returned
  const netUsedSet = new Set([...usedSet].filter(id => !returnedSet.has(id)));
  const usedQty = netUsedSet.size;

  const product = productMap[productId];
  const purchasePrice = parseFloat(product?.purchase_price || 0);
  const totalValue = totalQty * purchasePrice;

  totalUsedCount += usedQty;
  grandTotalAmount += totalValue;

  return {
    product_id: productId,
    total_quantity: totalQty,
    used_quantity: usedQty,
    available_quantity: availableAssets.length,
    purchase_price: purchasePrice,
    total_value: totalValue,
    asset_ids: availableAssets,
    product,
  };
});


    res.status(200).json({
      summary: {
        total_used_quantity: totalUsedCount,
        grand_total_stock_value: grandTotalAmount,
      },
      products: result,
    });
  } catch (error) {
    console.error("Error in getApprovedProductSummary:", error);
    res.status(500).json({
      message: "Internal server error",
      error
    });
  }
};





// Update a Goods Receipt
export const updateGoodsReceipt = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const {
      vendor_invoice_number,
      purchase_order_status,
      goods_receipt_date,
      purchase_type,
      goods_receipt_status,
      description,
      items = []
    } = req.body;

    const receipt = await GoodsReceipt.findByPk(id);
    if (!receipt) {
      return res.status(404).json({
        message: "Goods receipt not found"
      });
    }

    // ✅ Extract all incoming asset IDs from the update payload
    const incomingAssetIds = items.flatMap(item => item.asset_ids || []);

    // ✅ Get existing asset_ids from all other goods receipts (exclude current)
    const existingItems = await GoodsReceiptItem.findAll({
      where: {
        goods_receipt_id: {
          [db.Sequelize.Op.ne]: id
        }
      }, // exclude current
      attributes: ['asset_ids']
    });

    const existingAssetIds = [];
    for (const item of existingItems) {
      const ids = item.asset_ids || [];
      existingAssetIds.push(...ids);
    }

    // ✅ Check for duplicates
    const duplicateIds = incomingAssetIds.filter(id => existingAssetIds.includes(id));
    if (duplicateIds.length > 0) {
      return res.status(400).json({
        message: "Duplicate asset IDs found in other goods receipts.",
        duplicates: duplicateIds
      });
    }

    // ✅ Update the main receipt
    await receipt.update({
      vendor_invoice_number,
      purchase_order_status,
      goods_receipt_date,
      purchase_type,
      goods_receipt_status,
      description,
      updated_at: new Date()
    });

    // ✅ Update items (ensure match by product_id and goods_receipt_id)
    for (const item of items) {
      await GoodsReceiptItem.update({
        quantity: item.quantity,
        asset_ids: item.asset_ids || [],
      }, {
        where: {
          goods_receipt_id: id,
          product_id: item.product_id,
        },
      });
    }

    res.status(200).json({
      message: "Goods receipt updated successfully",
      receipt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error updating goods receipt",
      error
    });
  }
};



// Delete a Goods Receipt and its items
export const deleteGoodsReceipt = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const receipt = await GoodsReceipt.findByPk(id);

    if (!receipt) return res.status(404).json({
      message: "Goods receipt not found"
    });

    await GoodsReceiptItem.destroy({
      where: {
        goods_receipt_id: id
      }
    });
    await receipt.destroy();

    res.status(200).json({
      message: "Goods receipt and items deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error deleting goods receipt",
      error
    });
  }
};