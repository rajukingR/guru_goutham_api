import db from '../models/index.js';
import {
  Op
} from "sequelize";

const ProductTemplete = db.ProductTemplete;
const GoodsReceiptItem = db.GoodsReceiptItem;
const AssembledComponent = db.AssembledComponent;
const AssetIdComponent = db.AssetIdComponent;
const AssetTransaction = db.AssetTransaction;
const CreditNote = db.CreditNote;
const CreditNoteItem = db.CreditNoteItem;
const DispatchOrder = db.DispatchOrder;
const DispatchOrderItem = db.DispatchOrderItem;
const DeliveryChallan = db.DeliveryChallan;


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

// Get all products
export const getAllProducts = async (req, res) => {
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

    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching products',
      error
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

    const effectiveCapacity = capacity || (product_category === 'SMPS' ? smps : null);

    if (!product_category) {
      return res.status(400).json({
        error: 'product_category parameter is required'
      });
    }

    const capacityComponents = ['RAM', 'Storage Drive', 'HDD', 'SMPS', 'SSD'];
    const requiresCapacity = capacityComponents.includes(product_category);
    const isWifiRouter = product_category === 'Wi-Fi';

    const where = {
      product_category
    };

    if (product_category === 'RAM' && ramType) where.ramType = ramType;
    if (brand) where.brand = brand;
    if (model) where.model = model;
    if (isWifiRouter && frequency_band) where.frequency_band = frequency_band;
    if (isWifiRouter && wifi_standard) where.wifi_standard = wifi_standard;

    const products = await ProductTemplete.findAll({
      where,
      raw: true
    });

    if (products.length === 0) {
      return res.json([]);
    }

    // Handle Wi-Fi router specific responses
    if (isWifiRouter) {
      if (!brand) {
        return res.json([...new Set(products.map(p => p.brand))]);
      }
      if (!model) {
        return res.json([...new Set(products.map(p => p.model))]);
      }
      if (!frequency_band) {
        return res.json([...new Set(products.map(p => p.frequency_band).filter(Boolean))]);
      }
      if (!wifi_standard) {
        return res.json([...new Set(products.map(p => p.wifi_standard).filter(Boolean))]);
      }
    }

    if (!brand) {
      return res.json([...new Set(products.map(p => p.brand))]);
    }

    if (!model) {
      return res.json([...new Set(products.map(p => p.model))]);
    }

    if (requiresCapacity && !effectiveCapacity) {
      const capacities = [];
      products.forEach(product => {
        let capValue = '';
        switch (product_category) {
          case 'RAM':
            capValue = product.sizeGb || product.ram;
            break;
          case 'HDD':
          case 'Storage Drive':
          case 'SSD':
            capValue = product.storage || product.capacity;
            break;
          case 'SMPS':
            capValue = product.capacity || product.smps || product.wattage || '';
            break;
          default:
            capValue = product.capacity || '';
        }
        if (capValue && !capacities.includes(capValue)) capacities.push(capValue);
      });
      return res.json(capacities);
    }

    // Filter products by capacity if applicable
    let filteredProducts = products;
    if (requiresCapacity && effectiveCapacity) {
      filteredProducts = products.filter(product => {
        let productCapacity = '';
        switch (product_category) {
          case 'RAM':
            productCapacity = product.sizeGb || product.ram;
            break;
          case 'HDD':
          case 'Storage Drive':
            productCapacity = product.storage || product.capacity;
            break;
          case 'SMPS':
            productCapacity = product.capacity || product.smps || product.wattage || '';
            break;
          default:
            productCapacity = product.capacity || '';
        }
        return productCapacity === effectiveCapacity;
      });
    }

    // Get only products that are present in goods_receipt_items
    const productIds = filteredProducts.map(p => p.id);
    const receiptItems = await GoodsReceiptItem.findAll({
      where: {
        product_id: productIds
      },
      raw: true
    });
    const validProductIds = new Set(receiptItems.map(item => item.product_id));
    filteredProducts = filteredProducts.filter(p => validProductIds.has(p.id));

    // Get assembled components (to exclude asset_ids used in assemblies)
    const assembledComponents = await AssembledComponent.findAll({
      where: {
        product_id: productIds
      },
      raw: true
    });
    const usedInAssemblies = new Set(assembledComponents.map(c => c.asset_id));

    // 🔹 Get AssetIdComponents (to exclude asset_ids used as components)
    const assetIdComponents = await AssetIdComponent.findAll({
      where: {
        product_id: productIds
      },
      raw: true
    });
    const usedInAssetComponents = new Set(assetIdComponents.map(c => c.asset_id));

    // Extract asset IDs from valid products and filter out those used
    const assetMap = {};
    receiptItems.forEach(item => {
      if (!validProductIds.has(item.product_id)) return;

      try {
        const ids = typeof item.asset_ids === 'string' ?
          JSON.parse(item.asset_ids) :
          Array.isArray(item.asset_ids) ? item.asset_ids : [];

        if (!assetMap[item.product_id]) assetMap[item.product_id] = [];

        const availableAssets = ids.filter(id =>
          !usedInAssemblies.has(id) &&
          !usedInAssetComponents.has(id) // 🔹 new filter
        );

        assetMap[item.product_id].push(...availableAssets);
      } catch (e) {
        console.error('Error parsing asset_ids:', e);
      }
    });

    const response = Object.entries(assetMap).map(([product_id, asset_ids]) => ({
      product_id: Number(product_id),
      asset_ids
    }));

    res.json(response);

  } catch (error) {
    console.error('Error in getProductWithAssets:', error);
    res.status(500).json({
      error: error.message
    });
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

    if (!parentAssetId) {
      return res.status(400).json({ message: "asset_id query parameter is required" });
    }

    // Fetch product template
    const product = await ProductTemplete.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Fetch asset transactions
    const assetTransactions = await AssetTransaction.findAll({
      where: {
        product_id: productId,
        parent_asset_id: parentAssetId,
      },
      order: [["created_at", "DESC"]],
    });

    // ✅ itemsInfo: true only when status = "Removed" and is_default = "Default"
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
