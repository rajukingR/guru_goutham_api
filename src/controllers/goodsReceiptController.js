import db from '../models/index.js';
import { Op } from "sequelize";

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
  CreditNote,
  CreditNoteItem,
  AssembledAsset,
  AssembledComponent,
  AssetSwap,

} = db;

const Supplier = db.Supplier;
const AssetIdComponent = db.AssetIdComponent;
const AssetTransaction = db.AssetTransaction;


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


    const loginId = req.user.id;


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
      supplier_id: supplier_id || loginId,
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



export const getAllGoodsReceipts = async (req, res) => {
  try {

    //-----------------------------------------
    // PAGINATION
    //-----------------------------------------

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    //-----------------------------------------
    // SEARCH
    //-----------------------------------------

    const whereCondition = search
      ? {
          [Op.or]: [
            { goods_receipt_id: { [Op.like]: `%${search}%` } },
            { purchase_order_id: { [Op.like]: `%${search}%` } },
            { purchase_type: { [Op.like]: `%${search}%` } },
            { goods_receipt_status: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    //-----------------------------------------

    const { count, rows } = await GoodsReceipt.findAndCountAll({
      where: whereCondition,

      include: [
        {
          model: GoodsReceiptItem,
          as: "selected_products",
        },
        {
          model: Supplier,
          as: "supplier",
          attributes: ["id", "supplier_name"],
        },
      ],

      order: [["id", "DESC"]],
      limit,
      offset,

      distinct: true, // 🚨 MUST when hasMany exists
    });

    //-----------------------------------------

    res.status(200).json({
      data: rows,
      totalRecords: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error fetching goods receipts",
      error: error.message,
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




//UPDATED AT 22-11-2025

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

//       // ✅ Client side = used assets but NOT swapped
//       const clientSideAssetIds = totalAssetIds.filter(
//         id => !availableAssetIds.includes(id) && !swappedSet.has(id)
//       );

//       return {
//         product_id: productId,
//         total_quantity: adjustedTotalQty,
//         used_quantity: usedQty,
//         available_quantity: availableAssetIds.length,
//         purchase_price: purchasePrice,
//         total_value: totalValue,
//         total_asset_ids: totalAssetIds,
//         client_side_asset_ids: clientSideAssetIds,
//         available_asset_ids: availableAssetIds,
//         assembled_component_ids: Array.from(assemblyAssetsForThisProduct),
//         swapped_asset_ids: Array.from(swappedSet),  // ✅ separate
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

    // Helper function to check if two Assembled PC products have same specs
    const areSameAssembledSpecs = (product1, product2) => {
      if (!product1 || !product2) return false;
      
      if (product1.product_category !== 'Assembled PC' || product2.product_category !== 'Assembled PC') {
        return false;
      }

      return (
        product1.ram === product2.ram &&
        product1.disk_type === product2.disk_type &&
        product1.processor === product2.processor &&
        product1.storage === product2.storage &&
        product1.graphics === product2.graphics &&
        product1.cabinet === product2.cabinet &&
        product1.motherboard === product2.motherboard &&
        product1.smps === product2.smps &&
        product1.ramType === product2.ramType &&
        product1.processor_model === product2.processor_model &&
        product1.processor_speed === product2.processor_speed &&
        product1.generation === product2.generation &&
        product1.ram_speed === product2.ram_speed &&
        product1.ram_slots === product2.ram_slots &&
        product1.capacity === product2.capacity &&
        product1.ssd_type === product2.ssd_type
      );
    };

    // 🔍 Get search parameter
    const search = req.query.search || '';
    
    // 🧠 Check if pagination is requested (if page or limit exists in query)
    const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

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

    // 3. Get ALL delivered challans
    const deliveredChallans = await DeliveryChallan.findAll({
      where: { dc_status: 'Delivered' },
      attributes: ['id', 'dispatch_order_id', 'created_at'],
      include: [{
        model: DeliveryChallanItem,
        as: 'items',
        attributes: ['product_id', 'device_ids']
      }]
    });

    // 4. Get ALL credit notes
    const dispatchOrderIds = deliveredChallans.map(dc => dc.dispatch_order_id).filter(id => id);
    
    const creditNotes = await CreditNote.findAll({
      where: { dispatch_order_id: dispatchOrderIds },
      include: [{
        model: CreditNoteItem,
        as: 'items',
        attributes: ['product_id', 'device_ids']
      }]
    });

    const creditNoteMap = {};
    creditNotes.forEach(cn => {
      if (!creditNoteMap[cn.dispatch_order_id]) {
        creditNoteMap[cn.dispatch_order_id] = [];
      }
      creditNoteMap[cn.dispatch_order_id].push(...(cn.items || []));
    });

    // 5. Get ALL swapped assets
    const allDeviceIds = [];
    deliveredChallans.forEach(dc => {
      dc.items.forEach(item => {
        const deviceIds = parseIds(item.device_ids);
        allDeviceIds.push(...deviceIds);
      });
    });

    const assetSwaps = await AssetSwap.findAll({
      where: { asset_id: { [Op.in]: allDeviceIds } }
    });

    const swappedDeviceIds = new Set(assetSwaps.map(s => s.asset_id));

    // 6. Track client-side assets
    const clientSideAssetsByProduct = {};

    for (const challan of deliveredChallans) {
      const creditItems = creditNoteMap[challan.dispatch_order_id] || [];

      for (const item of challan.items) {
        const originalDeviceIds = parseIds(item.device_ids);
        let updatedDeviceIds = [...originalDeviceIds];

        creditItems
          .filter(ci => ci.product_id === item.product_id)
          .forEach(ret => {
            const returnedIds = parseIds(ret.device_ids);
            updatedDeviceIds = updatedDeviceIds.filter(id => !returnedIds.includes(id));
          });

        updatedDeviceIds = updatedDeviceIds.filter(id => !swappedDeviceIds.has(id));

        if (updatedDeviceIds.length > 0) {
          if (!clientSideAssetsByProduct[item.product_id]) {
            clientSideAssetsByProduct[item.product_id] = new Set();
          }
          updatedDeviceIds.forEach(id => clientSideAssetsByProduct[item.product_id].add(id));
        }
      }
    }

    // 7. Asset Swaps map
    const swappedAssets = await AssetSwap.findAll({
      attributes: ['product_id', 'asset_id']
    });

    const swappedAssetMap = {};
    for (const swap of swappedAssets) {
      if (!swappedAssetMap[swap.product_id]) swappedAssetMap[swap.product_id] = new Set();
      swappedAssetMap[swap.product_id].add(swap.asset_id);
    }

    // 8. Returned assets
    const creditReturnedMap = {};
    const creditNoteDeviceIdsSet = new Set();

    for (const creditNote of creditNotes) {
      if (creditNote.items) {
        for (const item of creditNote.items) {
          const ids = parseIds(item.device_ids);
          if (!creditReturnedMap[item.product_id]) creditReturnedMap[item.product_id] = new Set();
          ids.forEach(id => {
            creditReturnedMap[item.product_id].add(id);
            creditNoteDeviceIdsSet.add(id);
          });
        }
      }
    }

    // 9. Peripherals for returned devices
    let peripheralsByParent = {};
    let returnedPeripheralProductMap = {};

    if (creditNoteDeviceIdsSet.size > 0) {
      const returnedDeviceIds = Array.from(creditNoteDeviceIdsSet);

      const peripheralTransactions = await AssetTransaction.findAll({
        where: {
          parent_asset_id: returnedDeviceIds,
          status: 'Added',
          is_default: 'Upgraded'
        },
        attributes: [
          'parent_asset_id',
          'asset_id',
          'product_id',
          'peripheral_asset_id_product_id'
        ]
      });

      peripheralsByParent = {};
      for (const row of peripheralTransactions) {
        const parent = row.parent_asset_id;
        if (!peripheralsByParent[parent]) peripheralsByParent[parent] = [];

        peripheralsByParent[parent].push({
          asset_id: row.asset_id,
          product_id: row.product_id,
          peripheral_asset_id_product_id: row.peripheral_asset_id_product_id
        });

        if (row.peripheral_asset_id_product_id) {
          returnedPeripheralProductMap[row.asset_id] = row.peripheral_asset_id_product_id;
        } else if (row.product_id) {
          returnedPeripheralProductMap[row.asset_id] = row.product_id;
        }
      }
    }

    // 10. Assembled components
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

    // 11. Product templates
    const productIdsFromGRN = Object.keys(quantityMap).map(Number);
    
    // 🔍 SEARCH: Build where clause for product search
    let productWhereClause = { id: productIdsFromGRN };
    if (search && search.trim() !== '') {
      productWhereClause = {
        id: productIdsFromGRN,
        [Op.or]: [
          { product_name: { [Op.like]: `%${search}%` } },
          { brand: { [Op.like]: `%${search}%` } },
          { model: { [Op.like]: `%${search}%` } },
          { product_category: { [Op.like]: `%${search}%` } },
          { product_id: { [Op.like]: `%${search}%` } }
        ]
      };
    }
    
    const productTemplatesGRN = await ProductTemplete.findAll({
      where: productWhereClause
    });

    const productMap = Object.fromEntries(productTemplatesGRN.map(p => [p.id, p.toJSON()]));

    // Filter product IDs that match search
    const matchedProductIds = productTemplatesGRN.map(p => p.id);
    
    // Only process products that match search criteria
    let result = matchedProductIds.map(productId => {
      const totalQty = quantityMap[productId];
      const allAssetsFromGRN = assetMap[productId] || [];

      const assetsNotInAssemblies = allAssetsFromGRN.filter(assetId =>
        !allAssemblyAssetIds.has(assetId)
      );

      const totalAssetIds = [...new Set(assetsNotInAssemblies)];
      const clientSideSet = clientSideAssetsByProduct[productId] || new Set();
      const returnedSet = creditReturnedMap[productId] || new Set();
      const swappedSet = swappedAssetMap[productId] || new Set();

      const returnedPeripheralAssetsForThisProduct = new Set();
      for (const [assetId, peripheralProductId] of Object.entries(returnedPeripheralProductMap)) {
        if (Number(peripheralProductId) === productId) {
          returnedPeripheralAssetsForThisProduct.add(assetId);
        }
      }

      const availableSet = new Set(
        assetsNotInAssemblies.filter(id => 
          !clientSideSet.has(id) && !swappedSet.has(id)
        )
      );

      const assemblyAssetsForThisProduct = assemblyAssetsByProduct[productId] || new Set();
      const componentQty = assemblyAssetsForThisProduct.size;
      const swappedCount = swappedSet.size;
      
      const adjustedTotalQty = totalQty - componentQty - swappedCount;
      const usedQty = clientSideSet.size;
      const availableQty = availableSet.size;
      const product = productMap[productId];
      const purchasePrice = parseFloat(product?.purchase_price || 0);
      const totalValue = availableQty * purchasePrice;

      const returnedDevices = [];

      for (const deviceId of returnedSet) {
        returnedDevices.push({
          device_id: deviceId,
          peripherals: peripheralsByParent[deviceId] || []
        });
      }

      for (const assetId of returnedPeripheralAssetsForThisProduct) {
        if (!returnedSet.has(assetId)) {
          returnedDevices.push({
            device_id: assetId,
            peripherals: []
          });
        }
      }

      return {
        product_id: productId,
        total_quantity: adjustedTotalQty,
        used_quantity: usedQty,
        available_quantity: availableQty,
        purchase_price: purchasePrice,
        total_value: totalValue,
        total_asset_ids: totalAssetIds,
        client_side_asset_ids: Array.from(clientSideSet).sort((a, b) => String(a).localeCompare(String(b))),
        available_asset_ids: Array.from(availableSet).sort((a, b) => String(a).localeCompare(String(b))),
        assembled_component_ids: Array.from(assemblyAssetsForThisProduct).sort((a, b) => String(a).localeCompare(String(b))),
        swapped_asset_ids: Array.from(swappedSet).sort((a, b) => String(a).localeCompare(String(b))),
        returned_devices: returnedDevices.sort((a, b) => String(a.device_id).localeCompare(String(b.device_id))),
        product
      };
    });

    // 12. Include Assembled Assets (with search filter)
    const assembledAssets = await AssembledAsset.findAll({
      where: { is_active: 1 }
    });

    const assembledProductTemplates = await ProductTemplete.findAll({
      where: { 
        assembled_id: assembledAssets.map(a => a.id),
        ...(search && search.trim() !== '' ? {
          [Op.or]: [
            { product_name: { [Op.like]: `%${search}%` } },
            { brand: { [Op.like]: `%${search}%` } },
            { model: { [Op.like]: `%${search}%` } },
            { product_category: { [Op.like]: `%${search}%` } },
            { product_id: { [Op.like]: `%${search}%` } }
          ]
        } : {})
      }
    });

    for (const asset of assembledAssets) {
      const product = assembledProductTemplates.find(p => p.assembled_id === asset.id);
      if (!product) continue;

      const productId = product.id;
      const alreadyExists = result.some(r => r.product_id === productId);
      if (alreadyExists) continue;

      const parentAssetId = asset.parent_asset_id;
      const clientSideSet = clientSideAssetsByProduct[productId] || new Set();
      const returnedSet = creditReturnedMap[productId] || new Set();
      const swappedSet = swappedAssetMap[productId] || new Set();

      const returnedPeripheralAssetsForThisProduct = new Set();
      for (const [assetId, peripheralProductId] of Object.entries(returnedPeripheralProductMap)) {
        if (Number(peripheralProductId) === productId) {
          returnedPeripheralAssetsForThisProduct.add(assetId);
        }
      }

      const allReturnedForProduct = new Set([
        ...returnedSet,
        ...returnedPeripheralAssetsForThisProduct
      ]);

      const isWithClient = clientSideSet.has(parentAssetId);
      const isSwapped = swappedSet.has(parentAssetId);

      const usedQty = isWithClient ? 1 : 0;
      
      let availableAssetIds = [];
      if (!isWithClient && !isSwapped) {
        availableAssetIds = [parentAssetId];
      }

      const purchasePrice = parseFloat(product.purchase_price || 0);
      const totalValue = isSwapped ? 0 : purchasePrice;

      const returnedDevices = Array.from(allReturnedForProduct).map(deviceId => ({
        device_id: deviceId,
        peripherals: peripheralsByParent[deviceId] || []
      }));

      result.push({
        product_id: productId,
        total_quantity: isSwapped ? 0 : 1,
        used_quantity: usedQty,
        available_quantity: availableAssetIds.length,
        purchase_price: purchasePrice,
        total_value: totalValue,
        total_asset_ids: [parentAssetId],
        client_side_asset_ids: isWithClient ? [parentAssetId] : [],
        available_asset_ids: availableAssetIds,
        swapped_asset_ids: isSwapped ? [parentAssetId] : [],
        returned_devices: returnedDevices,
        product
      });
    }

    // 13. MERGE Assembled PC products with same specifications
    const mergedResult = [];
    const processedProductIds = new Set();

    for (let i = 0; i < result.length; i++) {
      const current = result[i];
      
      if (processedProductIds.has(current.product_id)) continue;
      
      if (current.product?.product_category === 'Assembled PC') {
        
        const sameSpecProducts = result.filter(item => 
          !processedProductIds.has(item.product_id) && 
          item.product?.product_category === 'Assembled PC' &&
          areSameAssembledSpecs(current.product, item.product)
        );
        
        if (sameSpecProducts.length > 1) {
          const merged = {
            product_id: sameSpecProducts[0].product_id,
            total_quantity: sameSpecProducts.reduce((sum, p) => sum + p.total_quantity, 0),
            used_quantity: sameSpecProducts.reduce((sum, p) => sum + p.used_quantity, 0),
            available_quantity: sameSpecProducts.reduce((sum, p) => sum + p.available_quantity, 0),
            purchase_price: sameSpecProducts[0].purchase_price,
            total_value: sameSpecProducts.reduce((sum, p) => sum + p.total_value, 0),
            total_asset_ids: sameSpecProducts.flatMap(p => p.total_asset_ids),
            client_side_asset_ids: sameSpecProducts.flatMap(p => p.client_side_asset_ids),
            available_asset_ids: sameSpecProducts.flatMap(p => p.available_asset_ids),
            assembled_component_ids: sameSpecProducts.flatMap(p => p.assembled_component_ids || []),
            swapped_asset_ids: sameSpecProducts.flatMap(p => p.swapped_asset_ids),
            returned_devices: sameSpecProducts.flatMap(p => p.returned_devices),
            product: sameSpecProducts[0].product,
            _mergedFrom: sameSpecProducts.map(p => p.product_id),
            _totalAssetCount: sameSpecProducts.flatMap(p => p.available_asset_ids).length
          };
          
          sameSpecProducts.forEach(p => processedProductIds.add(p.product_id));
          mergedResult.push(merged);
        } else {
          processedProductIds.add(current.product_id);
          mergedResult.push(current);
        }
      } else {
        processedProductIds.add(current.product_id);
        mergedResult.push(current);
      }
    }

    result = mergedResult;

    // Calculate totals
    let totalUsedCount = result.reduce((sum, p) => sum + p.used_quantity, 0);
    let grandTotalAmount = result.reduce((sum, p) => sum + p.total_value, 0);
    let totalAssembledComponents = allAssemblyAssetIds.size;

    // Sort products
    result.sort((a, b) => b.product_id - a.product_id);

    // 🎯 CONDITIONAL RESPONSE: Check if pagination is requested
    if (hasPagination) {
      // Return paginated response
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProducts = result.slice(startIndex, endIndex);
      const totalRecords = result.length;
      const totalPages = Math.ceil(totalRecords / limit);
      const paginatedUsedCount = paginatedProducts.reduce((sum, p) => sum + p.used_quantity, 0);
      const paginatedStockValue = paginatedProducts.reduce((sum, p) => sum + p.total_value, 0);

      res.status(200).json({
        summary: {
          total_used_quantity: paginatedUsedCount,
          grand_total_stock_value: paginatedStockValue,
          total_assembled_components: totalAssembledComponents
        },
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalRecords: totalRecords,
          limit: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        products: paginatedProducts
      });
    } else {
      // Return ALL data without pagination wrapper
      res.status(200).json({
        summary: {
          total_used_quantity: totalUsedCount,
          grand_total_stock_value: grandTotalAmount,
          total_assembled_components: totalAssembledComponents
        },
        products: result
      });
    }

  } catch (error) {
    console.error("Error in getApprovedProductSummary:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


export const getApprovedProductSummary1 = async (req, res) => {
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

    // 3. ALL USED devices (both currently used AND returned)
    const allUsedDeviceMap = {};

    // 3.1 Invoice Items
    const invoiceItems = await InvoiceItem.findAll({
      attributes: ['product_id', 'device_ids']
    });

    for (const item of invoiceItems) {
      const ids = parseIds(item.device_ids);
      if (!allUsedDeviceMap[item.product_id]) allUsedDeviceMap[item.product_id] = new Set();
      ids.forEach(id => allUsedDeviceMap[item.product_id].add(id));
    }

    // 3.2 Delivery Challan Items - DELIVERED items
    const deliveredChallans = await DeliveryChallan.findAll({
      where: { dc_status: 'Delivered' },
      attributes: ['id']
    });

    const deliveredChallanIds = deliveredChallans.map(dc => dc.id);

    if (deliveredChallanIds.length > 0) {
      const deliveredChallanItems = await DeliveryChallanItem.findAll({
        where: { 
          challan_id: deliveredChallanIds 
        },
        attributes: ['product_id', 'device_ids']
      });

      for (const item of deliveredChallanItems) {
        const ids = parseIds(item.device_ids);
        if (!allUsedDeviceMap[item.product_id]) allUsedDeviceMap[item.product_id] = new Set();
        ids.forEach(id => allUsedDeviceMap[item.product_id].add(id));
      }
    }

    // 3.3 Dispatch Order Items - APPROVED items
    const approvedDispatchOrders = await DispatchOrder.findAll({
      where: { dispatch_order_status: 'Approved' },
      attributes: ['id']
    });

    const approvedDispatchOrderIds = approvedDispatchOrders.map(order => order.id);

    if (approvedDispatchOrderIds.length > 0) {
      const dispatchOrderItems = await DispatchOrderItem.findAll({
        where: { 
          dispatch_order_id: approvedDispatchOrderIds 
        },
        attributes: ['product_id', 'device_ids']
      });

      for (const item of dispatchOrderItems) {
        const ids = parseIds(item.device_ids);
        if (!allUsedDeviceMap[item.product_id]) allUsedDeviceMap[item.product_id] = new Set();
        ids.forEach(id => allUsedDeviceMap[item.product_id].add(id));
      }
    }

    // 4. RETURNED assets (Credit Notes)
    const creditReturnedMap = {};
    const creditNoteItems = await CreditNoteItem.findAll({
      attributes: ['product_id', 'device_ids']
    });

    for (const item of creditNoteItems) {
      const ids = parseIds(item.device_ids);
      if (!creditReturnedMap[item.product_id]) creditReturnedMap[item.product_id] = new Set();
      ids.forEach(id => creditReturnedMap[item.product_id].add(id));
    }

    // 5. Asset Swaps
    const swappedAssets = await AssetSwap.findAll({
      attributes: ['product_id', 'asset_id']
    });

    const swappedAssetMap = {};
    for (const swap of swappedAssets) {
      if (!swappedAssetMap[swap.product_id]) swappedAssetMap[swap.product_id] = new Set();
      swappedAssetMap[swap.product_id].add(swap.asset_id);
    }

    // 6. Assembled components
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

    // 7. Product templates
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

      const allUsedSet = allUsedDeviceMap[productId] || new Set();
      const returnedSet = creditReturnedMap[productId] || new Set();
      const swappedSet = swappedAssetMap[productId] || new Set();

      // ✅ FIXED LOGIC: 
      // - Client side assets = ALL used assets (including returned ones that were re-used)
      // - Available assets = Assets NOT used at all (never sent to any client)
      
      const clientSideAssetIds = Array.from(allUsedSet).filter(
        id => !swappedSet.has(id)
      );

      // ✅ Available assets = Total assets MINUS:
      // - All used assets (both current and returned)
      // - Swapped assets
      // - Assets used in assemblies
      let availableAssetIds = assetsNotInAssemblies.filter(id =>
        !allUsedSet.has(id) && !swappedSet.has(id)
      );

      // Adjust quantities
      const assemblyAssetsForThisProduct = assemblyAssetsByProduct[productId] || new Set();
      const componentQty = assemblyAssetsForThisProduct.size;
      const swappedCount = swappedSet.size;
      
      // Total quantity excludes assembled components and swapped assets
      const adjustedTotalQty = totalQty - componentQty - swappedCount;

      // Used quantity = Currently with clients (excluding returned and not re-used)
      const currentlyUsedSet = new Set(
        Array.from(allUsedSet).filter(id => !returnedSet.has(id) || clientSideAssetIds.includes(id))
      );
      const usedQty = currentlyUsedSet.size;

      const product = productMap[productId];
      const purchasePrice = parseFloat(product?.purchase_price || 0);
      const totalValue = adjustedTotalQty * purchasePrice;

      totalUsedCount += usedQty;
      grandTotalAmount += totalValue;

      // ✅ Returned devices information
      const returnedDevices = Array.from(returnedSet).map(deviceId => ({
        device_id: deviceId,
        is_currently_used: clientSideAssetIds.includes(deviceId), // ✅ Track if re-used
        peripherals: []
      }));

      return {
        product_id: productId,
        total_quantity: adjustedTotalQty,
        used_quantity: usedQty,
        available_quantity: availableAssetIds.length,
        purchase_price: purchasePrice,
        total_value: totalValue,
        total_asset_ids: totalAssetIds,
        client_side_asset_ids: clientSideAssetIds, // ✅ All used assets (including re-used returns)
        available_asset_ids: availableAssetIds,     // ✅ Only never-used assets
        assembled_component_ids: Array.from(assemblyAssetsForThisProduct),
        swapped_asset_ids: Array.from(swappedSet),
        returned_devices: returnedDevices,
        product
      };
    });

    // 8. Include Assembled Assets (that are not in GRN list)
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
      const allUsedSet = allUsedDeviceMap[productId] || new Set();
      const returnedSet = creditReturnedMap[productId] || new Set();
      const swappedSet = swappedAssetMap[productId] || new Set();

      const isUsed = allUsedSet.has(parentAssetId);
      const isReturned = returnedSet.has(parentAssetId);
      const isSwapped = swappedSet.has(parentAssetId);

      const clientSideAssetIds = isUsed && !isSwapped ? [parentAssetId] : [];
      const availableAssetIds = (!isUsed && !isSwapped) ? [parentAssetId] : [];

      const usedQty = clientSideAssetIds.length;
      const purchasePrice = parseFloat(product.purchase_price || 0);
      const totalValue = isSwapped ? 0 : purchasePrice;

      totalUsedCount += usedQty;
      grandTotalAmount += totalValue;

      const returnedDevices = Array.from(returnedSet).map(deviceId => ({
        device_id: deviceId,
        is_currently_used: clientSideAssetIds.includes(deviceId),
        peripherals: []
      }));

      result.push({
        product_id: productId,
        total_quantity: isSwapped ? 0 : 1,
        used_quantity: usedQty,
        available_quantity: availableAssetIds.length,
        purchase_price: purchasePrice,
        total_value: totalValue,
        total_asset_ids: [parentAssetId],
        client_side_asset_ids: clientSideAssetIds,
        available_asset_ids: availableAssetIds,
        swapped_asset_ids: isSwapped ? [parentAssetId] : [],
        returned_devices: returnedDevices,
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




export const getApprovedProductSummaryDashboard = async (req, res) => {
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

    // 3. Get ALL delivered challans (source of truth for client-side assets)
    const deliveredChallans = await DeliveryChallan.findAll({
      where: { dc_status: 'Delivered' },
      attributes: ['id', 'dispatch_order_id', 'created_at'],
      include: [{
        model: DeliveryChallanItem,
        as: 'items',
        attributes: ['product_id', 'device_ids']
      }]
    });

    // 4. Get ALL credit notes (returns)
    const dispatchOrderIds = deliveredChallans.map(dc => dc.dispatch_order_id).filter(id => id);
    
    const creditNotes = await CreditNote.findAll({
      where: {
        dispatch_order_id: dispatchOrderIds
      },
      include: [{
        model: CreditNoteItem,
        as: 'items',
        attributes: ['product_id', 'device_ids']
      }]
    });

    // Map credit notes by dispatch_order_id
    const creditNoteMap = {};
    creditNotes.forEach(cn => {
      if (!creditNoteMap[cn.dispatch_order_id]) {
        creditNoteMap[cn.dispatch_order_id] = [];
      }
      creditNoteMap[cn.dispatch_order_id].push(...(cn.items || []));
    });

    // 5. Get ALL swapped assets
    const allDeviceIds = [];
    deliveredChallans.forEach(dc => {
      dc.items.forEach(item => {
        const deviceIds = parseIds(item.device_ids);
        allDeviceIds.push(...deviceIds);
      });
    });

    const assetSwaps = await AssetSwap.findAll({
      where: {
        asset_id: {
          [Op.in]: allDeviceIds
        }
      }
    });

    const swappedDeviceIds = new Set(assetSwaps.map(s => s.asset_id));

    // 6. Track CURRENTLY USED assets (with clients, filtered by returns and swaps)
    const currentlyUsedMap = {};

    for (const challan of deliveredChallans) {
      const creditItems = creditNoteMap[challan.dispatch_order_id] || [];

      for (const item of challan.items) {
        const originalDeviceIds = parseIds(item.device_ids);
        let updatedDeviceIds = [...originalDeviceIds];

        // Remove returned device IDs
        creditItems
          .filter(ci => ci.product_id === item.product_id)
          .forEach(ret => {
            const returnedIds = parseIds(ret.device_ids);
            updatedDeviceIds = updatedDeviceIds.filter(id => !returnedIds.includes(id));
          });

        // Remove swapped device IDs
        updatedDeviceIds = updatedDeviceIds.filter(id => !swappedDeviceIds.has(id));

        // Add to currently used map
        if (updatedDeviceIds.length > 0) {
          if (!currentlyUsedMap[item.product_id]) {
            currentlyUsedMap[item.product_id] = new Set();
          }
          updatedDeviceIds.forEach(id => currentlyUsedMap[item.product_id].add(id));
        }
      }
    }

    // 7. ALL USED (both current and returned) - for backward compatibility
    const allUsedDeviceMap = {};

    // Invoice Items
    const invoiceItems = await InvoiceItem.findAll({
      attributes: ['product_id', 'device_ids']
    });

    for (const item of invoiceItems) {
      const ids = parseIds(item.device_ids);
      if (!allUsedDeviceMap[item.product_id]) allUsedDeviceMap[item.product_id] = new Set();
      ids.forEach(id => allUsedDeviceMap[item.product_id].add(id));
    }

    // Delivery Challan Items (original, before filtering)
    for (const challan of deliveredChallans) {
      for (const item of challan.items) {
        const ids = parseIds(item.device_ids);
        if (!allUsedDeviceMap[item.product_id]) allUsedDeviceMap[item.product_id] = new Set();
        ids.forEach(id => allUsedDeviceMap[item.product_id].add(id));
      }
    }

    // Dispatch Order Items - APPROVED
    const approvedDispatchOrders = await DispatchOrder.findAll({
      where: { dispatch_order_status: 'Approved' },
      attributes: ['id']
    });

    const approvedDispatchOrderIds = approvedDispatchOrders.map(order => order.id);

    if (approvedDispatchOrderIds.length > 0) {
      const dispatchOrderItems = await DispatchOrderItem.findAll({
        where: {
          dispatch_order_id: approvedDispatchOrderIds
        },
        attributes: ['product_id', 'device_ids']
      });

      for (const item of dispatchOrderItems) {
        const ids = parseIds(item.device_ids);
        if (!allUsedDeviceMap[item.product_id]) allUsedDeviceMap[item.product_id] = new Set();
        ids.forEach(id => allUsedDeviceMap[item.product_id].add(id));
      }
    }

    // 8. RETURNED assets (Credit Notes) - for display
    const creditReturnedMap = {};
    const creditNoteItems = await CreditNoteItem.findAll({
      attributes: ['product_id', 'device_ids']
    });

    for (const item of creditNoteItems) {
      const ids = parseIds(item.device_ids);
      if (!creditReturnedMap[item.product_id]) creditReturnedMap[item.product_id] = new Set();
      ids.forEach(id => creditReturnedMap[item.product_id].add(id));
    }

    // 9. Asset Swaps
    const swappedAssets = await AssetSwap.findAll({
      attributes: ['product_id', 'asset_id']
    });

    const swappedAssetMap = {};
    for (const swap of swappedAssets) {
      if (!swappedAssetMap[swap.product_id]) swappedAssetMap[swap.product_id] = new Set();
      swappedAssetMap[swap.product_id].add(swap.asset_id);
    }

    // 10. Assembled components
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

    // 11. Product templates
    const productIdsFromGRN = Object.keys(quantityMap).map(Number);
    const productTemplatesGRN = await ProductTemplete.findAll({
      where: { id: productIdsFromGRN }
    });

    const productMap = Object.fromEntries(productTemplatesGRN.map(p => [p.id, p.toJSON()]));

    // Category-wise tracking
    const categoryWiseData = {};

    // Process products from GRN
    for (const productId of productIdsFromGRN) {
      const totalQty = quantityMap[productId];
      const allAssetsFromGRN = assetMap[productId] || [];

      // Remove assets that are part of assemblies
      const assetsNotInAssemblies = allAssetsFromGRN.filter(assetId =>
        !allAssemblyAssetIds.has(assetId)
      );

      // Assets currently with clients (filtered by returns and swaps)
      const currentlyUsedSet = currentlyUsedMap[productId] || new Set();
      
      const swappedSet = swappedAssetMap[productId] || new Set();

      // Adjust quantities
      const assemblyAssetsForThisProduct = assemblyAssetsByProduct[productId] || new Set();
      const componentQty = assemblyAssetsForThisProduct.size;
      const swappedCount = swappedSet.size;

      // Total quantity excludes assembled components and swapped assets
      const adjustedTotalQty = totalQty - componentQty - swappedCount;

      // Available assets = Total assets NOT currently with client and NOT swapped
      let availableAssetIds = assetsNotInAssemblies.filter(id =>
        !currentlyUsedSet.has(id) && !swappedSet.has(id)
      );

      // Used quantity = Currently with clients (filtered)
      const usedQty = currentlyUsedSet.size;

      const product = productMap[productId];

      // Category-wise aggregation
      const productCategory = product?.product_category || 'Uncategorized';
      if (!categoryWiseData[productCategory]) {
        categoryWiseData[productCategory] = {
          total_quantity: 0,
          used_quantity: 0,
          available_quantity: 0
        };
      }

      categoryWiseData[productCategory].total_quantity += adjustedTotalQty;
      categoryWiseData[productCategory].used_quantity += usedQty;
      categoryWiseData[productCategory].available_quantity += availableAssetIds.length;
    }

    // 12. Include Assembled Assets (that are not in GRN list)
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

      // Skip if already counted from GRN
      if (productIdsFromGRN.includes(productId)) continue;

      const parentAssetId = asset.parent_asset_id;
      const currentlyUsedSet = currentlyUsedMap[productId] || new Set();
      const swappedSet = swappedAssetMap[productId] || new Set();

      const isUsed = currentlyUsedSet.has(parentAssetId);
      const isSwapped = swappedSet.has(parentAssetId);

      const availableAssetIds = (!isUsed && !isSwapped) ? [parentAssetId] : [];

      const usedQty = (isUsed && !isSwapped) ? 1 : 0;
      const totalQtyForAsset = isSwapped ? 0 : 1;
      const availableQtyForAsset = availableAssetIds.length;

      // Category-wise aggregation for assembled assets
      const productCategory = product?.product_category || 'Uncategorized';
      if (!categoryWiseData[productCategory]) {
        categoryWiseData[productCategory] = {
          total_quantity: 0,
          used_quantity: 0,
          available_quantity: 0
        };
      }

      categoryWiseData[productCategory].total_quantity += totalQtyForAsset;
      categoryWiseData[productCategory].used_quantity += usedQty;
      categoryWiseData[productCategory].available_quantity += availableQtyForAsset;
    }

    // Format category-wise data as array
    const categorySummary = Object.entries(categoryWiseData).map(([category, data]) => ({
      product_category: category,
      available_quantity: data.available_quantity,
      total_quantity: data.total_quantity,
      used_quantity: data.used_quantity
    }));

    // Calculate summary totals
    const summary = {
      total_used_quantity: Object.values(categoryWiseData).reduce((sum, cat) => sum + cat.used_quantity, 0),
      total_available_quantity: Object.values(categoryWiseData).reduce((sum, cat) => sum + cat.available_quantity, 0),
      total_stock_quantity: Object.values(categoryWiseData).reduce((sum, cat) => sum + cat.total_quantity, 0),
      total_assembled_components: allAssemblyAssetIds.size
    };

    res.status(200).json({
      summary,
      category_summary: categorySummary
    });

  } catch (error) {
    console.error("Error in getApprovedProductSummaryDashboard:", error);
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
      supplier_id,
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
      supplier_id,
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