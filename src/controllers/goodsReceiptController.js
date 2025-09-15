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
  AssetId,
  DispatchOrder,
  DispatchOrderItem,
  CreditNoteItem,
  AssembledAsset,
  AssembledComponent,
  AssetSwap,

} = db;

const Supplier = db.Supplier;
const AssetIdComponent = db.AssetIdComponent;



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

    // 1. Check for duplicate goods_receipt_id
    const existingGR = await GoodsReceipt.findOne({
      where: {
        goods_receipt_id
      }
    });
    if (existingGR) {
      return res.status(400).json({
        message: "Goods Receipt ID already exists."
      });
    }

    // 2. Get all existing asset_ids from DB
    const existingItems = await GoodsReceiptItem.findAll({
      attributes: ['asset_ids']
    });

    const existingAssetIds = [];
    for (const item of existingItems) {
      const ids = item.asset_ids || [];
      existingAssetIds.push(...ids);
    }

    // 3. Check for duplicate asset IDs per item
    const duplicateDetails = items.map(item => {
      const duplicates = (item.asset_ids || []).filter(id => existingAssetIds.includes(id));
      return {
        product_id: item.product_id,
        product_name: item.product_name,
        duplicates
      };
    }).filter(d => d.duplicates.length > 0);

    if (duplicateDetails.length > 0) {
      return res.status(400).json({
        message: "Duplicate asset IDs found for some products.",
        duplicateDetails
      });
    }

    // 4. Create main goods receipt
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

    // 5. Create GoodsReceiptItems
    const receiptItems = await GoodsReceiptItem.bulkCreate(
      items.map(item => ({
        goods_receipt_id: receipt.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        asset_ids: item.asset_ids || [],
      }))
    );

    // 6. Create AssetId entries
    const assetEntries = [];
    for (const item of items) {
      const product = await ProductTemplete.findByPk(item.product_id);
      if (!product) continue;

      for (const assetId of item.asset_ids || []) {
        assetEntries.push({
          invoice_id: receipt.id, // if you are using invoice_id in AssetId
          product_id: item.product_id,
          asset_id: assetId,
          product_name: item.product_name,
          ram: product.ram,
          storage: product.storage,
          processor: product.processor,
          os: product.os,
          graphics: product.graphics,
          disk_type: product.disk_type,
          brand: product.brand,
          model: product.model,
          grade: product.grade,
          screen_size: product.screen_size,
          resolution: product.resolution,
          brightness: product.brightness,
          power_consumption: product.power_consumption,
          display_device: product.display_device,
          audio_output: product.audio_output,
          weight: product.weight,
          color: product.color,
        });
      }
    }

    if (assetEntries.length > 0) {
      await AssetId.bulkCreate(assetEntries);
    }

    return res.status(201).json({
      message: "Goods receipt and assets created successfully",
      receipt
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error creating goods receipt",
      error: error.message
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
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'supplier_name']
        }
      ],
      order: [
        ['id', 'DESC']
      ] // 👈 Sort by ID descending

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



//UPDATED 05-08025



// export const getApprovedProductSummary = async (req, res) => {
//   try {
//     // 1. Get Approved GRNs
//     const approvedReceipts = await GoodsReceipt.findAll({
//       where: {
//         goods_receipt_status: 'Approved'
//       },
//       attributes: ['id']
//     });
//     const approvedReceiptIds = approvedReceipts.map(r => r.id);

//     if (approvedReceiptIds.length === 0) {
//       return res.status(200).json({
//         summary: {},
//         products: []
//       });
//     }

//     // 2. Fetch GoodsReceiptItems
//     const receiptItems = await GoodsReceiptItem.findAll({
//       where: {
//         goods_receipt_id: approvedReceiptIds
//       },
//       attributes: ['product_id', 'quantity', 'asset_ids']
//     });

//     const quantityMap = {};
//     const assetMap = {};

//     for (const item of receiptItems) {
//       const productId = item.product_id;
//       const qty = item.quantity || 0;
//       const assets = Array.isArray(item.asset_ids) ?
//         item.asset_ids :
//         JSON.parse(item.asset_ids || '[]');

//       quantityMap[productId] = (quantityMap[productId] || 0) + qty;
//       if (!assetMap[productId]) assetMap[productId] = [];
//       assetMap[productId].push(...assets);
//     }

//     // Helper to parse asset ID arrays
//     const parseIds = (ids) => {
//       if (!ids) return [];
//       if (Array.isArray(ids)) return ids;
//       try {
//         return JSON.parse(ids);
//       } catch {
//         return [];
//       }
//     };

//     // 3. Used devices (from Invoices, DCs, Dispatch Orders)
//     const usedDeviceMap = {};

//     // Invoices
//     const invoiceItems = await InvoiceItem.findAll({
//       attributes: ['product_id', 'device_ids']
//     });
//     for (const item of invoiceItems) {
//       const pid = item.product_id;
//       const ids = parseIds(item.device_ids);
//       if (!usedDeviceMap[pid]) usedDeviceMap[pid] = new Set();
//       ids.forEach(id => usedDeviceMap[pid].add(id));
//     }

//     // Delivery Challans (Delivered)
//     const deliveredChallanItems = await DeliveryChallanItem.findAll({
//       include: [{
//         model: DeliveryChallan,
//         as: 'challan',
//         where: {
//           dc_status: 'Delivered'
//         },
//         attributes: []
//       }],
//       attributes: ['product_id', 'device_ids']
//     });
//     for (const item of deliveredChallanItems) {
//       const pid = item.product_id;
//       const ids = parseIds(item.device_ids);
//       if (!usedDeviceMap[pid]) usedDeviceMap[pid] = new Set();
//       ids.forEach(id => usedDeviceMap[pid].add(id));
//     }

//     // Dispatch Orders (Approved)
//     const dispatchOrderItems = await DispatchOrderItem.findAll({
//       include: [{
//         model: DispatchOrder,
//         as: 'dispatchOrder',
//         where: {
//           dispatch_order_status: 'Approved'
//         },
//         attributes: []
//       }],
//       attributes: ['product_id', 'device_ids']
//     });
//     for (const item of dispatchOrderItems) {
//       const pid = item.product_id;
//       const ids = parseIds(item.device_ids);
//       if (!usedDeviceMap[pid]) usedDeviceMap[pid] = new Set();
//       ids.forEach(id => usedDeviceMap[pid].add(id));
//     }

//     // 4. Returned assets (from Credit Notes)
//     const creditReturnedMap = {};
//     const creditNoteItems = await CreditNoteItem.findAll({
//       attributes: ['product_id', 'device_ids']
//     });
//     for (const item of creditNoteItems) {
//       const pid = item.product_id;
//       const ids = parseIds(item.device_ids);
//       if (!creditReturnedMap[pid]) creditReturnedMap[pid] = new Set();
//       ids.forEach(id => creditReturnedMap[pid].add(id));
//     }

//     // 5. Fetch product templates
//     const productIds = Object.keys(quantityMap).map(Number);
//     const productTemplates = await ProductTemplete.findAll({
//       where: {
//         id: productIds
//       }
//     });
//     const productMap = Object.fromEntries(productTemplates.map(p => [p.id, p.toJSON()]));

//     // 6. Aggregate result
//     let totalUsedCount = 0;
//     let grandTotalAmount = 0;

//     const result = productIds.map(productId => {
//       const totalQty = quantityMap[productId];
//       const allAssets = assetMap[productId] || [];

//       const usedSet = usedDeviceMap[productId] || new Set();
//       const returnedSet = creditReturnedMap[productId] || new Set();

//       // Final used = all used - returned
//       const finalUsedSet = new Set([...usedSet].filter(id => !returnedSet.has(id)));

//       const availableAssetIds = allAssets.filter(id =>
//         !finalUsedSet.has(id) || returnedSet.has(id)
//       );

//       const usedQty = finalUsedSet.size;
//       const product = productMap[productId];
//       const purchasePrice = parseFloat(product?.purchase_price || 0);
//       const totalValue = totalQty * purchasePrice;

//       totalUsedCount += usedQty;
//       grandTotalAmount += totalValue;

//       return {
//         product_id: productId,
//         total_quantity: totalQty,
//         used_quantity: usedQty,
//         available_quantity: availableAssetIds.length,
//         purchase_price: purchasePrice,
//         total_value: totalValue,
//         available_asset_ids: availableAssetIds,
//         product
//       };
//     });

//     res.status(200).json({
//       summary: {
//         total_used_quantity: totalUsedCount,
//         grand_total_stock_value: grandTotalAmount
//       },
//       products: result
//     });

//   } catch (error) {
//     console.error("Error in getApprovedProductSummary:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// };


////06-09-25

// export const getApprovedProductSummary = async (req, res) => {
//   try {
//     const parseIds = (ids) => {
//       if (!ids) return [];
//       if (Array.isArray(ids)) return ids;
//       try {
//         return JSON.parse(ids);
//       } catch {
//         return [];
//       }
//     };

//     // 1. Get Approved GRNs
//     const approvedReceipts = await GoodsReceipt.findAll({
//       where: { goods_receipt_status: 'Approved' },
//       attributes: ['id']
//     });

//     const approvedReceiptIds = approvedReceipts.map(r => r.id);
//     const quantityMap = {};
//     const assetMap = {};

//     // 2. Fetch GRN Items
//     if (approvedReceiptIds.length > 0) {
//       const receiptItems = await GoodsReceiptItem.findAll({
//         where: { goods_receipt_id: approvedReceiptIds },
//         attributes: ['product_id', 'quantity', 'asset_ids']
//       });

//       for (const item of receiptItems) {
//         const productId = item.product_id;
//         const qty = item.quantity || 0;
//         const assets = parseIds(item.asset_ids);

//         quantityMap[productId] = (quantityMap[productId] || 0) + qty;
//         if (!assetMap[productId]) assetMap[productId] = [];
//         assetMap[productId].push(...assets);
//       }
//     }

//     // 3. Used devices
//     const usedDeviceMap = {};

//     const invoiceItems = await InvoiceItem.findAll({
//       attributes: ['product_id', 'device_ids']
//     });

//     for (const item of invoiceItems) {
//       const ids = parseIds(item.device_ids);
//       if (!usedDeviceMap[item.product_id]) usedDeviceMap[item.product_id] = new Set();
//       ids.forEach(id => usedDeviceMap[item.product_id].add(id));
//     }

//     const deliveredChallanItems = await DeliveryChallanItem.findAll({
//       include: [{
//         model: DeliveryChallan,
//         as: 'challan',
//         where: { dc_status: 'Delivered' },
//         attributes: []
//       }],
//       attributes: ['product_id', 'device_ids']
//     });

//     for (const item of deliveredChallanItems) {
//       const ids = parseIds(item.device_ids);
//       if (!usedDeviceMap[item.product_id]) usedDeviceMap[item.product_id] = new Set();
//       ids.forEach(id => usedDeviceMap[item.product_id].add(id));
//     }

//     const dispatchOrderItems = await DispatchOrderItem.findAll({
//       include: [{
//         model: DispatchOrder,
//         as: 'dispatchOrder',
//         where: { dispatch_order_status: 'Approved' },
//         attributes: []
//       }],
//       attributes: ['product_id', 'device_ids']
//     });

//     for (const item of dispatchOrderItems) {
//       const ids = parseIds(item.device_ids);
//       if (!usedDeviceMap[item.product_id]) usedDeviceMap[item.product_id] = new Set();
//       ids.forEach(id => usedDeviceMap[item.product_id].add(id));
//     }

//     // 3.5. Asset Swaps
//     const swappedAssets = await AssetSwap.findAll({
//       attributes: ['product_id', 'asset_id']
//     });

//     const swappedAssetMap = {};
//     for (const swap of swappedAssets) {
//       if (!swappedAssetMap[swap.product_id]) swappedAssetMap[swap.product_id] = new Set();
//       swappedAssetMap[swap.product_id].add(swap.asset_id);
//     }

//     // 4. Returned assets
//     const creditReturnedMap = {};
//     const creditNoteItems = await CreditNoteItem.findAll({
//       attributes: ['product_id', 'device_ids']
//     });

//     for (const item of creditNoteItems) {
//       const ids = parseIds(item.device_ids);
//       if (!creditReturnedMap[item.product_id]) creditReturnedMap[item.product_id] = new Set();
//       ids.forEach(id => creditReturnedMap[item.product_id].add(id));
//     }

//     // 5. Assembled components
//     const assembledComponents = await AssembledComponent.findAll({
//       attributes: ['asset_id', 'product_id']
//     });

//     const allAssemblyAssetIds = new Set();
//     const assemblyAssetsByProduct = {};

//     for (const comp of assembledComponents) {
//       if (comp.asset_id) {
//         allAssemblyAssetIds.add(comp.asset_id);

//         if (!assemblyAssetsByProduct[comp.product_id]) {
//           assemblyAssetsByProduct[comp.product_id] = new Set();
//         }
//         assemblyAssetsByProduct[comp.product_id].add(comp.asset_id);
//       }
//     }

//     // 6. Product templates
//     const productIdsFromGRN = Object.keys(quantityMap).map(Number);
//     const productTemplatesGRN = await ProductTemplete.findAll({
//       where: { id: productIdsFromGRN }
//     });

//     const productMap = Object.fromEntries(productTemplatesGRN.map(p => [p.id, p.toJSON()]));

//     let totalUsedCount = 0;
//     let grandTotalAmount = 0;

//     const result = productIdsFromGRN.map(productId => {
//       const totalQty = quantityMap[productId];
//       const allAssetsFromGRN = assetMap[productId] || [];

//       // Remove assets that are part of assemblies
//       const assetsNotInAssemblies = allAssetsFromGRN.filter(assetId =>
//         !allAssemblyAssetIds.has(assetId)
//       );

//       const totalAssetIds = [...new Set(assetsNotInAssemblies)];

//       const usedSet = usedDeviceMap[productId] || new Set();
//       const returnedSet = creditReturnedMap[productId] || new Set();
//       const swappedSet = swappedAssetMap[productId] || new Set();

//       // Final used set (exclude returned)
//       const finalUsedSet = new Set(
//         [...usedSet].filter(id => !returnedSet.has(id))
//       );

//       // Available assets (not used, not returned, not swapped)
//       let availableAssetIds = assetsNotInAssemblies.filter(id =>
//         !finalUsedSet.has(id)
//       );
//       availableAssetIds = availableAssetIds.filter(id => !swappedSet.has(id));

//       // Adjust quantities
//       const assemblyAssetsForThisProduct = assemblyAssetsByProduct[productId] || new Set();
//       const componentQty = assemblyAssetsForThisProduct.size;
//       const swappedCount = swappedSet.size;
//       const adjustedTotalQty = totalQty - componentQty - swappedCount;

//       const usedQty = finalUsedSet.size;
//       const product = productMap[productId];
//       const purchasePrice = parseFloat(product?.purchase_price || 0);
//       const totalValue = adjustedTotalQty * purchasePrice;

//       totalUsedCount += usedQty;
//       grandTotalAmount += totalValue;

//       return {
//         product_id: productId,
//         total_quantity: adjustedTotalQty,
//         used_quantity: usedQty,
//         available_quantity: availableAssetIds.length,
//         purchase_price: purchasePrice,
//         total_value: totalValue,
//         total_asset_ids: totalAssetIds,
//         client_side_asset_ids: totalAssetIds.filter(id => !availableAssetIds.includes(id)),
//         available_asset_ids: availableAssetIds,
//         assembled_component_ids: Array.from(assemblyAssetsForThisProduct),
//         swapped_asset_ids: Array.from(swappedSet),  // ✅ show swapped separately
//         product
//       };
//     });

//     // 7. Include Assembled Assets (that are not in GRN list)
//     const assembledAssets = await AssembledAsset.findAll({
//       where: { is_active: 1 }
//     });

//     const assembledProductTemplates = await ProductTemplete.findAll({
//       where: { assembled_id: assembledAssets.map(a => a.id) }
//     });

//     for (const asset of assembledAssets) {
//       const product = assembledProductTemplates.find(p => p.assembled_id === asset.id);
//       if (!product) continue;

//       const productId = product.id;
//       const alreadyExists = result.some(r => r.product_id === productId);
//       if (alreadyExists) continue;

//       const parentAssetId = asset.parent_asset_id;
//       const usedSet = usedDeviceMap[productId] || new Set();
//       const returnedSet = creditReturnedMap[productId] || new Set();
//       const swappedSet = swappedAssetMap[productId] || new Set();

//       const isUsed = usedSet.has(parentAssetId) && !returnedSet.has(parentAssetId);
//       const isSwapped = swappedSet.has(parentAssetId);

//       const usedQty = isUsed ? 1 : 0;
//       const availableAssetIds = (isUsed || isSwapped) ? [] : [parentAssetId];
//       const purchasePrice = parseFloat(product.purchase_price || 0);
//       const totalValue = purchasePrice;

//       totalUsedCount += usedQty;
//       grandTotalAmount += totalValue;

//       result.push({
//         product_id: productId,
//         total_quantity: isSwapped ? 0 : 1,
//         used_quantity: usedQty,
//         available_quantity: availableAssetIds.length,
//         purchase_price: purchasePrice,
//         total_value: totalValue,
//         total_asset_ids: [parentAssetId],
//         client_side_asset_ids: isUsed ? [parentAssetId] : [],
//         available_asset_ids: availableAssetIds,
//         swapped_asset_ids: isSwapped ? [parentAssetId] : [],
//         product
//       });
//     }

//     result.sort((a, b) => b.product_id - a.product_id);

//     res.status(200).json({
//       summary: {
//         total_used_quantity: totalUsedCount,
//         grand_total_stock_value: grandTotalAmount,
//         total_assembled_components: allAssemblyAssetIds.size
//       },
//       products: result
//     });

//   } catch (error) {
//     console.error("Error in getApprovedProductSummary:", error);
//     res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };


export const getApprovedProductSummary = async (req, res) => {
  try {
    const parseIds = (ids) => {
      if (!ids) return [];
      if (Array.isArray(ids)) return ids;
      try {
        return JSON.parse(ids);
      } catch {
        return [];
      }
    };

    // 1. Get Approved GRNs
    const approvedReceipts = await GoodsReceipt.findAll({
      where: { goods_receipt_status: 'Approved' },
      attributes: ['id']
    });

    const approvedReceiptIds = approvedReceipts.map(r => r.id);
    const quantityMap = {};
    const assetMap = {};

    // 2. Fetch GRN Items
    if (approvedReceiptIds.length > 0) {
      const receiptItems = await GoodsReceiptItem.findAll({
        where: { goods_receipt_id: approvedReceiptIds },
        attributes: ['product_id', 'quantity', 'asset_ids']
      });

      for (const item of receiptItems) {
        const productId = item.product_id;
        const qty = item.quantity || 0;
        const assets = parseIds(item.asset_ids);

        quantityMap[productId] = (quantityMap[productId] || 0) + qty;
        if (!assetMap[productId]) assetMap[productId] = [];
        assetMap[productId].push(...assets);
      }
    }

    // 3. Used devices
    const usedDeviceMap = {};

    const invoiceItems = await InvoiceItem.findAll({
      attributes: ['product_id', 'device_ids']
    });

    for (const item of invoiceItems) {
      const ids = parseIds(item.device_ids);
      if (!usedDeviceMap[item.product_id]) usedDeviceMap[item.product_id] = new Set();
      ids.forEach(id => usedDeviceMap[item.product_id].add(id));
    }

    const deliveredChallanItems = await DeliveryChallanItem.findAll({
      include: [{
        model: DeliveryChallan,
        as: 'challan',
        where: { dc_status: 'Delivered' },
        attributes: []
      }],
      attributes: ['product_id', 'device_ids']
    });

    for (const item of deliveredChallanItems) {
      const ids = parseIds(item.device_ids);
      if (!usedDeviceMap[item.product_id]) usedDeviceMap[item.product_id] = new Set();
      ids.forEach(id => usedDeviceMap[item.product_id].add(id));
    }

    const dispatchOrderItems = await DispatchOrderItem.findAll({
      include: [{
        model: DispatchOrder,
        as: 'dispatchOrder',
        where: { dispatch_order_status: 'Approved' },
        attributes: []
      }],
      attributes: ['product_id', 'device_ids']
    });

    for (const item of dispatchOrderItems) {
      const ids = parseIds(item.device_ids);
      if (!usedDeviceMap[item.product_id]) usedDeviceMap[item.product_id] = new Set();
      ids.forEach(id => usedDeviceMap[item.product_id].add(id));
    }

    // 3.5. Asset Swaps
    const swappedAssets = await AssetSwap.findAll({
      attributes: ['product_id', 'asset_id']
    });

    const swappedAssetMap = {};
    for (const swap of swappedAssets) {
      if (!swappedAssetMap[swap.product_id]) swappedAssetMap[swap.product_id] = new Set();
      swappedAssetMap[swap.product_id].add(swap.asset_id);
    }

    // 4. Returned assets
    const creditReturnedMap = {};
    const creditNoteItems = await CreditNoteItem.findAll({
      attributes: ['product_id', 'device_ids']
    });

    for (const item of creditNoteItems) {
      const ids = parseIds(item.device_ids);
      if (!creditReturnedMap[item.product_id]) creditReturnedMap[item.product_id] = new Set();
      ids.forEach(id => creditReturnedMap[item.product_id].add(id));
    }

    // 5. Assembled components
    const assembledComponents = await AssembledComponent.findAll({
      attributes: ['asset_id', 'product_id']
    });

    const allAssemblyAssetIds = new Set();
    const assemblyAssetsByProduct = {};

    for (const comp of assembledComponents) {
      if (comp.asset_id) {
        allAssemblyAssetIds.add(comp.asset_id);

        if (!assemblyAssetsByProduct[comp.product_id]) {
          assemblyAssetsByProduct[comp.product_id] = new Set();
        }
        assemblyAssetsByProduct[comp.product_id].add(comp.asset_id);
      }
    }

    // 6. Product templates
    const productIdsFromGRN = Object.keys(quantityMap).map(Number);
    const productTemplatesGRN = await ProductTemplete.findAll({
      where: { id: productIdsFromGRN }
    });

    const productMap = Object.fromEntries(productTemplatesGRN.map(p => [p.id, p.toJSON()]));

    let totalUsedCount = 0;
    let grandTotalAmount = 0;

    const result = productIdsFromGRN.map(productId => {
      const totalQty = quantityMap[productId];
      const allAssetsFromGRN = assetMap[productId] || [];

      // Remove assets that are part of assemblies
      const assetsNotInAssemblies = allAssetsFromGRN.filter(assetId =>
        !allAssemblyAssetIds.has(assetId)
      );

      const totalAssetIds = [...new Set(assetsNotInAssemblies)];

      const usedSet = usedDeviceMap[productId] || new Set();
      const returnedSet = creditReturnedMap[productId] || new Set();
      const swappedSet = swappedAssetMap[productId] || new Set();

      // Final used set (exclude returned)
      const finalUsedSet = new Set(
        [...usedSet].filter(id => !returnedSet.has(id))
      );

      // Available assets (not used, not returned, not swapped)
      let availableAssetIds = assetsNotInAssemblies.filter(id =>
        !finalUsedSet.has(id)
      );
      availableAssetIds = availableAssetIds.filter(id => !swappedSet.has(id));

      // Adjust quantities
      const assemblyAssetsForThisProduct = assemblyAssetsByProduct[productId] || new Set();
      const componentQty = assemblyAssetsForThisProduct.size;
      const swappedCount = swappedSet.size;
      const adjustedTotalQty = totalQty - componentQty - swappedCount;

      const usedQty = finalUsedSet.size;
      const product = productMap[productId];
      const purchasePrice = parseFloat(product?.purchase_price || 0);
      const totalValue = adjustedTotalQty * purchasePrice;

      totalUsedCount += usedQty;
      grandTotalAmount += totalValue;

      // ✅ Client side = used assets but NOT swapped
      const clientSideAssetIds = totalAssetIds.filter(
        id => !availableAssetIds.includes(id) && !swappedSet.has(id)
      );

      return {
        product_id: productId,
        total_quantity: adjustedTotalQty,
        used_quantity: usedQty,
        available_quantity: availableAssetIds.length,
        purchase_price: purchasePrice,
        total_value: totalValue,
        total_asset_ids: totalAssetIds,
        client_side_asset_ids: clientSideAssetIds,
        available_asset_ids: availableAssetIds,
        assembled_component_ids: Array.from(assemblyAssetsForThisProduct),
        swapped_asset_ids: Array.from(swappedSet),  // ✅ separate
        product
      };
    });

    // 7. Include Assembled Assets (that are not in GRN list)
    const assembledAssets = await AssembledAsset.findAll({
      where: { is_active: 1 }
    });

    const assembledProductTemplates = await ProductTemplete.findAll({
      where: { assembled_id: assembledAssets.map(a => a.id) }
    });

    for (const asset of assembledAssets) {
      const product = assembledProductTemplates.find(p => p.assembled_id === asset.id);
      if (!product) continue;

      const productId = product.id;
      const alreadyExists = result.some(r => r.product_id === productId);
      if (alreadyExists) continue;

      const parentAssetId = asset.parent_asset_id;
      const usedSet = usedDeviceMap[productId] || new Set();
      const returnedSet = creditReturnedMap[productId] || new Set();
      const swappedSet = swappedAssetMap[productId] || new Set();

      const isUsed = usedSet.has(parentAssetId) && !returnedSet.has(parentAssetId);
      const isSwapped = swappedSet.has(parentAssetId);

      const usedQty = isUsed ? 1 : 0;
      const availableAssetIds = (isUsed || isSwapped) ? [] : [parentAssetId];
      const purchasePrice = parseFloat(product.purchase_price || 0);
      const totalValue = purchasePrice;

      totalUsedCount += usedQty;
      grandTotalAmount += totalValue;

      result.push({
        product_id: productId,
        total_quantity: isSwapped ? 0 : 1,
        used_quantity: usedQty,
        available_quantity: availableAssetIds.length,
        purchase_price: purchasePrice,
        total_value: totalValue,
        total_asset_ids: [parentAssetId],
        client_side_asset_ids: isUsed ? [parentAssetId] : [],
        available_asset_ids: availableAssetIds,
        swapped_asset_ids: isSwapped ? [parentAssetId] : [],
        product
      });
    }

    result.sort((a, b) => b.product_id - a.product_id);

    res.status(200).json({
      summary: {
        total_used_quantity: totalUsedCount,
        grand_total_stock_value: grandTotalAmount,
        total_assembled_components: allAssemblyAssetIds.size
      },
      products: result
    });

  } catch (error) {
    console.error("Error in getApprovedProductSummary:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};






// Update a Goods Receipt
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

    // 1. Find existing receipt
    const receipt = await GoodsReceipt.findByPk(id);
    if (!receipt) {
      return res.status(404).json({
        message: "Goods receipt not found"
      });
    }

    // 2. Get all existing asset_ids from other receipts (exclude current)
    const existingItems = await GoodsReceiptItem.findAll({
      where: {
        goods_receipt_id: {
          [db.Sequelize.Op.ne]: id
        }
      },
      attributes: ["asset_ids"]
    });

    const existingAssetIds = [];
    for (const item of existingItems) {
      const ids = item.asset_ids || [];
      existingAssetIds.push(...ids);
    }

    // 3. Check for duplicate asset IDs in payload
    const duplicateDetails = items
      .map((item) => {
        const duplicates = (item.asset_ids || []).filter((id) =>
          existingAssetIds.includes(id)
        );
        return {
          product_id: item.product_id,
          product_name: item.product_name,
          duplicates
        };
      })
      .filter((d) => d.duplicates.length > 0);

    if (duplicateDetails.length > 0) {
      return res.status(400).json({
        message: "Duplicate asset IDs found in other goods receipts.",
        duplicateDetails
      });
    }

    // 4. Update main receipt
    await receipt.update({
      vendor_invoice_number,
      purchase_order_status,
      goods_receipt_date,
      purchase_type,
      goods_receipt_status,
      description,
      updated_at: new Date()
    });

    // 5. Update or create GoodsReceiptItems
    for (const item of items) {
      const existingItem = await GoodsReceiptItem.findOne({
        where: {
          goods_receipt_id: id,
          product_id: item.product_id
        }
      });

      if (existingItem) {
        await existingItem.update({
          quantity: item.quantity,
          asset_ids: item.asset_ids || []
        });
      } else {
        await GoodsReceiptItem.create({
          goods_receipt_id: id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          asset_ids: item.asset_ids || []
        });
      }
    }

    // 6. Update AssetId table
    // Remove old assets for this receipt
    await AssetId.destroy({
      where: {
        invoice_id: id
      }
    });

    // Insert fresh AssetIds from updated items
    const assetEntries = [];
    for (const item of items) {
      const product = await ProductTemplete.findByPk(item.product_id);
      if (!product) continue;

      for (const assetId of item.asset_ids || []) {
        assetEntries.push({
          invoice_id: id,
          product_id: item.product_id,
          asset_id: assetId,
          product_name: item.product_name,
          ram: product.ram,
          storage: product.storage,
          processor: product.processor,
          os: product.os,
          graphics: product.graphics,
          disk_type: product.disk_type,
          brand: product.brand,
          model: product.model,
          grade: product.grade,
          screen_size: product.screen_size,
          resolution: product.resolution,
          brightness: product.brightness,
          power_consumption: product.power_consumption,
          display_device: product.display_device,
          audio_output: product.audio_output,
          weight: product.weight,
          color: product.color
        });
      }
    }

    if (assetEntries.length > 0) {
      await AssetId.bulkCreate(assetEntries);
    }

    return res.status(200).json({
      message: "Goods receipt updated successfully",
      receipt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error updating goods receipt",
      error: error.message
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