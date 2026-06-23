import db from '../models/index.js';
import {
  Op
} from "sequelize";

const ProductTemplete = db.ProductTemplete;
const GoodsReceipt = db.GoodsReceipt;
const GoodsReceiptItem = db.GoodsReceiptItem;
const AssembledComponent = db.AssembledComponent;
const AssetTransaction = db.AssetTransaction;
const CreditNote = db.CreditNote;
const CreditNoteItem = db.CreditNoteItem;
const DispatchOrder = db.DispatchOrder;
const DispatchOrderItem = db.DispatchOrderItem;
const DeliveryChallan = db.DeliveryChallan;
const DeliveryChallanItem = db.DeliveryChallanItem;
const InvoiceItem = db.InvoiceItem;
const AssetSwap = db.AssetSwap;
const AssembledAsset = db.AssembledAsset;


// Create a new product
export const createProduct = async (req, res) => {
  try {
    const {
      body,
      file
    } = req;

    if (file) {
      body.product_image = file.filename;
    }

    const product = await ProductTemplete.create(body);

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error creating product',
      error
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    //----------------------------------
    // SEARCH CONDITION
    //----------------------------------

    const whereCondition = {
      ...(search && {
        [Op.or]: [
          { product_name: { [Op.like]: `%${search}%` } },
          { product_id: { [Op.like]: `%${search}%` } },
          { brand: { [Op.like]: `%${search}%` } },
          { model: { [Op.like]: `%${search}%` } },
          { product_category: { [Op.like]: `%${search}%` } },
        ],
      }),
    };

    //----------------------------------

    const { count, rows } = await ProductTemplete.findAndCountAll({
      where: whereCondition,
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

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching products",
      error: error.message,
    });
  }
};






// Get all products
export const getAllProducts1 = async (req, res) => {
  try {
    const products = await ProductTemplete.findAll({
      order: [
        ['id', 'DESC']
      ], // 👈 Sort by ID in descending order
    });
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching products',
      error
    });
  }
};


export const getAllProductsWithoutActive = async (req, res) => {
  try {
    const products = await ProductTemplete.findAll({
      where: {
        [Op.or]: [
          { is_deleted: false },
          { is_active: true }
        ]
      },
      order: [['id', 'DESC']],
    });

    const areSameAssembledSpecs = (product1, product2) => {
      if (!product1 || !product2) return false;
      
      if (product1.product_category !== 'Assembled PC' || product2.product_category !== 'Assembled PC') {
        return false;
      }

      const specsToCompare = [
        'ram', 'disk_type', 'processor', 'storage', 'graphics', 
        'cabinet', 'motherboard', 'smps', 'ramType', 
        'processor_model', 'processor_speed', 'generation', 
        'ram_speed', 'ram_slots', 'capacity', 'ssd_type',
        'brand', 'grade', 'model'
      ];
      
      for (const spec of specsToCompare) {
        if (product1[spec] !== product2[spec]) return false;
      }
      
      return true;
    };

    // Group and merge Assembled PC products
    const assembledPCs = [];
    const otherProducts = [];

    for (const product of products) {
      const productData = product.toJSON ? product.toJSON() : product;
      
      if (productData.product_category === 'Assembled PC') {
        assembledPCs.push(productData);
      } else {
        otherProducts.push(productData);
      }
    }

    // Merge Assembled PCs with same specs
    const mergedAssembledPCs = [];
    const processedIndices = new Set();

    for (let i = 0; i < assembledPCs.length; i++) {
      if (processedIndices.has(i)) continue;

      const currentProduct = assembledPCs[i];
      const sameSpecProducts = [currentProduct];
      
      for (let j = i + 1; j < assembledPCs.length; j++) {
        if (processedIndices.has(j)) continue;
        
        if (areSameAssembledSpecs(currentProduct, assembledPCs[j])) {
          sameSpecProducts.push(assembledPCs[j]);
          processedIndices.add(j);
        }
      }
      
      if (sameSpecProducts.length > 1) {
        const mergedProduct = { ...currentProduct };
        
        // Collect all IDs
        const allIds = sameSpecProducts.map(p => p.id);
        const allProductIds = sameSpecProducts.map(p => p.product_id);
        
        mergedProduct.id = allIds[0];
        mergedProduct.product_id = allProductIds[0];
        mergedProduct.merged_from_ids = allIds;
        mergedProduct.merged_from_product_ids = allProductIds;
        mergedProduct.total_merged_count = sameSpecProducts.length;
        mergedProduct.is_merged = true;
        
        mergedAssembledPCs.push(mergedProduct);
        processedIndices.add(i);
      } else {
        mergedAssembledPCs.push(currentProduct);
        processedIndices.add(i);
      }
    }

    // Combine and sort
    let finalProducts = [...mergedAssembledPCs, ...otherProducts];
    finalProducts.sort((a, b) => b.id - a.id);

    res.status(200).json(finalProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching products',
      error: error.message || error
    });
  }
};

const parseJSONSafe = (input) => {
  try {
    if (typeof input === "string") return JSON.parse(input);
    return Array.isArray(input) ? input : [];
  } catch {
    return [];
  }
};

export const getProductWithAssets = async (req, res) => {
  try {
    const {
      product_category,
      ramType,
      brand,
      model,
      capacity,
      smps,
      frequency_band,
      wifi_standard
    } = req.query;

    if (!product_category) {
      return res.status(400).json({ error: "product_category parameter is required" });
    }

    // ✅ Correct capacity-based categories
    const capacityComponents = [
      "RAM",
      "HDD Storage",
      "SSD Storage",
      "NVMe Storage",
      "SMPS"
    ];

    const requiresCapacity = capacityComponents.includes(product_category);
    const effectiveCapacity =
      product_category === "SMPS" ? smps || capacity : capacity || null;

    const isWifi = product_category === "Wi-Fi Card" || product_category === "Wi-Fi Dongle";

    const where = { product_category };

    if (product_category === "RAM" && ramType) where.ramType = ramType;
    if (brand) where.brand = brand;
    if (model) where.model = model;
    if (isWifi && frequency_band) where.frequency_band = frequency_band;
    if (isWifi && wifi_standard) where.wifi_standard = wifi_standard;

    const products = await ProductTemplete.findAll({ where, raw: true });

    if (!products.length) return res.json([]);

    /* ================= WIFI CASCADE ================= */
    if (isWifi) {
      if (!brand) return res.json([...new Set(products.map(p => p.brand))]);
      if (!model) return res.json([...new Set(products.map(p => p.model))]);
      if (!frequency_band) {
        return res.json([...new Set(products.map(p => p.frequency_band).filter(Boolean))]);
      }
      if (!wifi_standard) {
        return res.json([...new Set(products.map(p => p.wifi_standard).filter(Boolean))]);
      }
    }

    /* ================= BRAND → MODEL ================= */
    if (!brand) return res.json([...new Set(products.map(p => p.brand))]);
    if (!model) return res.json([...new Set(products.map(p => p.model))]);

    /* ================= CAPACITY STEP (HARD STOP) ================= */
    if (requiresCapacity && !effectiveCapacity) {
      const capacities = [];

      products.forEach(product => {
        let cap = "";
        switch (product_category) {
          case "RAM":
            cap = product.sizeGb || product.ram;
            break;
          case "HDD Storage":
          case "SSD Storage":
          case "NVMe Storage":
            cap = product.storage || product.capacity;
            break;
          case "SMPS":
            cap = product.wattage || product.smps || product.capacity;
            break;
          default:
            cap = product.capacity;
        }
        if (cap && !capacities.includes(cap)) capacities.push(cap);
      });

      return res.json(capacities); // ✅ STOP HERE
    }

    /* ================= FILTER BY CAPACITY ================= */
    let filteredProducts = products;

    if (requiresCapacity && effectiveCapacity) {
      filteredProducts = products.filter(product => {
        let cap = "";
        switch (product_category) {
          case "RAM":
            cap = product.sizeGb || product.ram;
            break;
          case "HDD Storage":
          case "SSD Storage":
          case "NVMe Storage":
            cap = product.storage || product.capacity;
            break;
          case "SMPS":
            cap = product.wattage || product.smps || product.capacity;
            break;
          default:
            cap = product.capacity;
        }
        return cap === effectiveCapacity;
      });
    }

    const productIds = filteredProducts.map(p => p.id);
    if (!productIds.length) return res.json([]);

    // ==================== NEW LOGIC: Aligned with getApprovedProductSummary ====================
    
    // Parse function (same as in getApprovedProductSummary)
    const parseIds = (ids) => {
      if (!ids) return [];
      if (Array.isArray(ids)) return ids;
      try {
        return JSON.parse(ids);
      } catch {
        return [];
      }
    };

    // 1. Get all assets from approved GRNs for these products
    const approvedReceipts = await GoodsReceipt.findAll({
      where: { goods_receipt_status: 'Approved' },
      attributes: ['id']
    });

    const approvedReceiptIds = approvedReceipts.map(r => r.id);
    const assetMap = {};

    if (approvedReceiptIds.length > 0) {
      const receiptItems = await GoodsReceiptItem.findAll({
        where: { 
          goods_receipt_id: approvedReceiptIds,
          product_id: productIds
        },
        attributes: ['product_id', 'asset_ids']
      });

      for (const item of receiptItems) {
        const productId = item.product_id;
        const assets = parseIds(item.asset_ids);

        if (!assetMap[productId]) assetMap[productId] = [];
        assetMap[productId].push(...assets);
      }
    }

    // 2. Get ALL used devices (for availability calculation)
    const allUsedDeviceMap = {};

    // 2.1 Invoice Items
    const invoiceItems = await InvoiceItem.findAll({
      where: { product_id: productIds },
      attributes: ['product_id', 'device_ids']
    });

    for (const item of invoiceItems) {
      const ids = parseIds(item.device_ids);
      if (!allUsedDeviceMap[item.product_id]) allUsedDeviceMap[item.product_id] = new Set();
      ids.forEach(id => allUsedDeviceMap[item.product_id].add(id));
    }

    // 2.2 Delivery Challan Items - DELIVERED items
    const deliveredChallans = await DeliveryChallan.findAll({
      where: { dc_status: 'Delivered' },
      attributes: ['id']
    });
    const deliveredChallanIds = deliveredChallans.map(dc => dc.id);

    if (deliveredChallanIds.length > 0) {
      const deliveredChallanItems = await DeliveryChallanItem.findAll({
        where: { 
          challan_id: deliveredChallanIds,
          product_id: productIds
        },
        attributes: ['product_id', 'device_ids']
      });

      for (const item of deliveredChallanItems) {
        const ids = parseIds(item.device_ids);
        if (!allUsedDeviceMap[item.product_id]) allUsedDeviceMap[item.product_id] = new Set();
        ids.forEach(id => allUsedDeviceMap[item.product_id].add(id));
      }
    }

    // 2.3 Dispatch Order Items - APPROVED items
    const approvedDispatchOrders = await DispatchOrder.findAll({
      where: { dispatch_order_status: 'Approved' },
      attributes: ['id']
    });
    const approvedDispatchOrderIds = approvedDispatchOrders.map(order => order.id);

    if (approvedDispatchOrderIds.length > 0) {
      const dispatchOrderItems = await DispatchOrderItem.findAll({
        where: { 
          dispatch_order_id: approvedDispatchOrderIds,
          product_id: productIds
        },
        attributes: ['product_id', 'device_ids']
      });

      for (const item of dispatchOrderItems) {
        const ids = parseIds(item.device_ids);
        if (!allUsedDeviceMap[item.product_id]) allUsedDeviceMap[item.product_id] = new Set();
        ids.forEach(id => allUsedDeviceMap[item.product_id].add(id));
      }
    }

    // 3. Assets used in assemblies
    const assembledComponents = await AssembledComponent.findAll({
      where: { product_id: productIds },
      attributes: ['asset_id', 'product_id']
    });

    const allAssemblyAssetIds = new Set();
    for (const comp of assembledComponents) {
      if (comp.asset_id) {
        allAssemblyAssetIds.add(comp.asset_id);
      }
    }

    // 4. Swapped assets
    const swappedAssets = await AssetSwap.findAll({
      where: { product_id: productIds },
      attributes: ['product_id', 'asset_id']
    });

    const swappedAssetMap = {};
    for (const swap of swappedAssets) {
      if (!swappedAssetMap[swap.product_id]) swappedAssetMap[swap.product_id] = new Set();
      swappedAssetMap[swap.product_id].add(swap.asset_id);
    }

    // 5. Calculate available assets for each product
    const response = [];

    for (const product of filteredProducts) {
      const productId = product.id;
      const allAssetsFromGRN = assetMap[productId] || [];

      // Remove assets that are part of assemblies (same logic)
      const assetsNotInAssemblies = allAssetsFromGRN.filter(assetId =>
        !allAssemblyAssetIds.has(assetId)
      );

      const allUsedSet = allUsedDeviceMap[productId] || new Set();
      const swappedSet = swappedAssetMap[productId] || new Set();

      // ✅ Available assets = Total assets MINUS:
      // - All used assets (both current and returned)
      // - Swapped assets
      // - Assets used in assemblies
      const availableAssetIds = assetsNotInAssemblies.filter(id =>
        !allUsedSet.has(id) && !swappedSet.has(id)
      );

      response.push({
        product_id: productId,
        product_name: product.product_name,
        product_category: product.product_category,
        brand: product.brand,
        model: product.model,
        asset_ids: availableAssetIds,
        available_quantity: availableAssetIds.length,
        total_asset_ids: [...new Set(assetsNotInAssemblies)],
        total_quantity: assetsNotInAssemblies.length,
        used_assets_count: allUsedSet.size,
        assembled_assets_count: Array.from(allAssemblyAssetIds).filter(id => 
          allAssetsFromGRN.includes(id)
        ).length,
        swapped_assets_count: swappedSet.size
      });
    }

    // 6. Include Assembled Assets (that are not in GRN list but active)
    const assembledAssets = await AssembledAsset.findAll({
      where: { is_active: 1 }
    });

    const assembledProductTemplates = await ProductTemplete.findAll({
      where: { 
        assembled_id: assembledAssets.map(a => a.id),
        product_category 
      }
    });

    for (const asset of assembledAssets) {
      const product = assembledProductTemplates.find(p => p.assembled_id === asset.id);
      if (!product) continue;

      const productId = product.id;
      
      // Skip if already included
      const alreadyExists = response.some(r => r.product_id === productId);
      if (alreadyExists) continue;

      const parentAssetId = asset.parent_asset_id;
      const allUsedSet = allUsedDeviceMap[productId] || new Set();
      const swappedSet = swappedAssetMap[productId] || new Set();

      const isUsed = allUsedSet.has(parentAssetId);
      const isSwapped = swappedSet.has(parentAssetId);

      const availableAssetIds = (!isUsed && !isSwapped) ? [parentAssetId] : [];

      response.push({
        product_id: productId,
        product_name: product.product_name,
        product_category: product.product_category,
        brand: product.brand,
        model: product.model,
        available_asset_ids: availableAssetIds,
        available_quantity: availableAssetIds.length,
        total_asset_ids: [parentAssetId],
        total_quantity: isSwapped ? 0 : 1,
        used_assets_count: isUsed ? 1 : 0,
        assembled_assets_count: 0,
        swapped_assets_count: isSwapped ? 1 : 0,
        is_assembled_asset: true
      });
    }

    return res.json(response);

  } catch (error) {
    console.error("Error in getProductWithAssets:", error);
    return res.status(500).json({ error: error.message });
  }
};









// Get all Assembled Desktop products
export const getAllAssembledDesktops = async (req, res) => {
  try {
    const products = await ProductTemplete.findAll({
      where: {
        product_category: 'Assembled Desktop'
      },
      attributes: ['id', 'product_id', 'product_name', 'product_category'], // Select only these fields
      order: [
        ['id', 'DESC']
      ]
    });

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching Assembled Desktop products:', error);
    res.status(500).json({
      message: 'Error fetching Assembled Desktop products',
      error
    });
  }
};



// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await ProductTemplete.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching product',
      error
    });
  }
};



export const getProductByIdWithTransactions = async (req, res) => {
  try {
    const productId = req.params.id;
    const parentAssetId = req.query.asset_id;

    // Fetch product template
    const product = await ProductTemplete.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let peripherals_asset_ids = [];
    let all_asset_ids = [];

    // ✅ Only run this block if asset_id is provided
    if (parentAssetId) {
      const parentComponent = await AssembledComponent.findOne({
        where: { asset_id: parentAssetId }
      });

      // ✅ If found → process
      if (parentComponent) {
        const assembledId = parentComponent.assembled_id;

        const allComponents = await AssembledComponent.findAll({
          where: { assembled_id: assembledId }
        });

        // Exclude main components
        const mainComponents = ['ram', 'cabinet', 'processor', 'motherboard', 'storage', 'psu'];

        peripherals_asset_ids = allComponents
          .filter(comp => !mainComponents.includes(comp.type?.toLowerCase()))
          .map(comp => ({
            id: comp.id,
            asset_id: comp.asset_id,
            type: comp.type,
            component_type: comp.component_type,
            brand: comp.brand,
            model: comp.model,
            size: comp.size,
            wattage: comp.wattage
          }));

        all_asset_ids = allComponents.map(comp => comp.asset_id);
      }

      // ❌ If NOT found → skip (no error)
    }

    // Fetch asset transactions (works even without asset_id)
    const assetTransactions = await AssetTransaction.findAll({
      where: {
        product_id: productId,
        ...(parentAssetId && { parent_asset_id: parentAssetId }),
      },
      order: [["created_at", "DESC"]],
    });

    const itemsInfo = {
      ram: assetTransactions.some(
        (t) => t.item_type === "ram" && t.status === "Removed" && t.is_default === "Default"
      ),
      processor_model: assetTransactions.some(
        (t) => t.item_type === "processor" && t.status === "Removed" && t.is_default === "Default"
      ),
      storage: assetTransactions.some(
        (t) => t.item_type === "storage" && t.status === "Removed" && t.is_default === "Default"
      ),
    };

    res.status(200).json({
      ...product.toJSON(),
      itemsInfo,
      assetTransactions,
      peripherals_asset_ids,
      all_asset_ids,
    });

  } catch (error) {
    console.error("Sequelize error:", error);
    res.status(500).json({
      message: "Error fetching product",
      error: error.message || error,
    });
  }
};




// Update product
export const updateProduct = async (req, res) => {
  try {
    const { body, file } = req;

    if (file) {
      body.product_image = file.filename;
    }

    const product = await ProductTemplete.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ⭐ PREVENT CONFLICT: Active product cannot be deleted
    if (body.is_active === true) {
      body.is_deleted = false;    
    }

    // ⭐ If soft delete = true → make is_active = false
    if (body.is_deleted === true) {
      body.is_active = false; 
    }

    await product.update(body);

    res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error updating product",
      error,
    });
  }
};






// export const updateProduct = async (req, res) => {
//   try {
//     const {
//       body,
//       file
//     } = req;
//     if (file) {
//       body.product_image = file.filename;
//     }

//     const product = await ProductTemplete.findByPk(req.params.id);
//     if (!product) {
//       return res.status(404).json({
//         message: 'Product not found'
//       });
//     }

//     await product.update(body);
//     res.status(200).json({
//       message: 'Product updated successfully',
//       product
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: 'Error updating product',
//       error
//     });
//   }
// };




const checkIfProductInUse = async (productId) => {
  // Fetch all dispatch orders containing this product
  const orders = await DispatchOrder.findAll({
    include: [
      {
        model: DispatchOrderItem,
        as: "items",
        where: { product_id: productId },
        required: true
      },
      { model: DeliveryChallan, as: "delivery_challans", required: false }
    ]
  });

  // Apply your EXACT SAME logic for qty updates based on returns & swaps
  for (const order of orders) {
    const creditNotes = await CreditNote.findAll({
      where: { dispatch_order_id: order.id },
      include: [{ model: CreditNoteItem, as: "items" }]
    });

    const allReturnedItems = [];
    for (const cn of creditNotes) {
      for (const item of cn.items) {
        allReturnedItems.push({
          product_id: item.product_id,
          returned_quantity: item.quantity,
          returned_device_ids: item.device_ids || []
        });
      }
    }

    // Apply same item calculation as your main function
    for (const item of order.items) {
      if (item.product_id !== productId) continue;

      const matchedReturns = allReturnedItems.filter(
        (ret) => ret.product_id === productId
      );

      let returnedDeviceIds = [];
      for (const ret of matchedReturns) {
        returnedDeviceIds.push(...ret.returned_device_ids);
      }

      item.dataValues.device_ids = item.device_ids?.filter(
        (id) => !returnedDeviceIds.includes(id)
      );

      if (!item.dataValues.device_ids || item.dataValues.device_ids.length === 0) {
        item.dataValues.quantity = 0;
      } else {
        item.dataValues.quantity = item.dataValues.device_ids.length;
      }

      if (item.dataValues.quantity > 0) {
        return true; // product STILL IN USE → delete not allowed
      }
    }
  }

  return false; // no active qty → safe to delete
};



// SOFT DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await ProductTemplete.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if product still in rental use after full adjustments
    const isInUse = await checkIfProductInUse(productId);

    if (isInUse) {
      return res.status(400).json({
        message: "Cannot delete. Product is still in rental use"
      });
    }

    // Safe to Soft Delete
    await ProductTemplete.update(
      { is_deleted: 1, is_active: 0 },
      { where: { id: productId } }
    );

    return res.status(200).json({
      message: "Product soft-deleted successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error deleting product",
      error
    });
  }
};






// export const deleteProduct = async (req, res) => {
//   try {
//     const product = await ProductTemplete.findByPk(req.params.id);
//     if (!product) {
//       return res.status(404).json({
//         message: 'Product not found'
//       });
//     }

//     await product.destroy();
//     res.status(200).json({
//       message: 'Product deleted successfully'
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: 'Error deleting product',
//       error
//     });
//   }
// };
