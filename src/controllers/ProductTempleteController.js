import db from '../models/index.js';

const ProductTemplete = db.ProductTemplete;
const GoodsReceiptItem = db.GoodsReceiptItem;
const AssembledComponent = db.AssembledComponent;
const AssetIdComponent = db.AssetIdComponent;

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

    const where = { product_category };

    if (product_category === 'RAM' && ramType) where.ramType = ramType;
    if (brand) where.brand = brand;
    if (model) where.model = model;
    if (isWifiRouter && frequency_band) where.frequency_band = frequency_band;
    if (isWifiRouter && wifi_standard) where.wifi_standard = wifi_standard;

    const products = await ProductTemplete.findAll({ where, raw: true });

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
          case 'RAM': capValue = product.sizeGb || product.ram; break;
          case 'HDD':
          case 'Storage Drive':
          case 'SSD': capValue = product.storage || product.capacity; break;
          case 'SMPS': capValue = product.capacity || product.smps || product.wattage || ''; break;
          default: capValue = product.capacity || '';
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
          case 'RAM': productCapacity = product.sizeGb || product.ram; break;
          case 'HDD':
          case 'Storage Drive': productCapacity = product.storage || product.capacity; break;
          case 'SMPS': productCapacity = product.capacity || product.smps || product.wattage || ''; break;
          default: productCapacity = product.capacity || '';
        }
        return productCapacity === effectiveCapacity;
      });
    }

    // Get only products that are present in goods_receipt_items
    const productIds = filteredProducts.map(p => p.id);
    const receiptItems = await GoodsReceiptItem.findAll({
      where: { product_id: productIds },
      raw: true
    });
    const validProductIds = new Set(receiptItems.map(item => item.product_id));
    filteredProducts = filteredProducts.filter(p => validProductIds.has(p.id));

    // Get assembled components (to exclude asset_ids used in assemblies)
    const assembledComponents = await AssembledComponent.findAll({
      where: { product_id: productIds },
      raw: true
    });
    const usedInAssemblies = new Set(assembledComponents.map(c => c.asset_id));

    // 🔹 Get AssetIdComponents (to exclude asset_ids used as components)
    const assetIdComponents = await AssetIdComponent.findAll({
      where: { product_id: productIds },
      raw: true
    });
    const usedInAssetComponents = new Set(assetIdComponents.map(c => c.asset_id));

    // Extract asset IDs from valid products and filter out those used
    const assetMap = {};
    receiptItems.forEach(item => {
      if (!validProductIds.has(item.product_id)) return;

      try {
        const ids = typeof item.asset_ids === 'string'
          ? JSON.parse(item.asset_ids)
          : Array.isArray(item.asset_ids) ? item.asset_ids : [];

        if (!assetMap[item.product_id]) assetMap[item.product_id] = [];

        const availableAssets = ids.filter(id => 
          !usedInAssemblies.has(id) && 
          !usedInAssetComponents.has(id)   // 🔹 new filter
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
    res.status(500).json({ error: error.message });
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

// Update product
export const updateProduct = async (req, res) => {
  try {
    const {
      body,
      file
    } = req;
    if (file) {
      body.product_image = file.filename;
    }

    const product = await ProductTemplete.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    await product.update(body);
    res.status(200).json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error updating product',
      error
    });
  }
};


// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await ProductTemplete.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    await product.destroy();
    res.status(200).json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error deleting product',
      error
    });
  }
};