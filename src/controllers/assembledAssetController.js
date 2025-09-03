import db from "../models/index.js";
import {
  Op
} from 'sequelize';
const {
  AssembledAsset,
  AssembledComponent,
  ProductTemplete
} = db;

// Utility to generate random product ID
const generateRandomProductId = () => {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PRD-${randomStr}`;
};

export const createAssembledAsset = async (req, res) => {
  try {
    const file = req.file;
    const body = req.body;

    // Parse assembled_data JSON
    const assembledData = JSON.parse(body.assembled_data);

    const {
      assembled_name,
      parent_asset_id,
      components,
      is_active = true
    } = assembledData;

    // Step 1: Create AssembledAsset
    const assembledAsset = await AssembledAsset.create({
      assembled_name,
      parent_asset_id,
      product_image: file?.filename || '', // ✅ Save image filename here

      is_active
    });

    // Step 2: Handle AssembledComponent
    const componentsData = [];

    for (const [componentType, value] of Object.entries(components)) {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (item.asset_id?.trim()) {
        componentsData.push({
          assembled_id: assembledAsset.id,
          component_type: componentType,
          ...item,
          product_id: item.product_id ? parseInt(item.product_id) : null,
          ...(componentType === 'wifi' && {
            frequency_band: item.frequency_band || '',
            wifi_standard: item.wifi_standard || ''
          }),
        });
      }
    }
  } else if (value?.asset_id?.trim()) {
    componentsData.push({
      assembled_id: assembledAsset.id,
      component_type: componentType,
      ...value,
      product_id: value.product_id ? parseInt(value.product_id) : null,
      ...(componentType === 'wifi' && {
        frequency_band: value.frequency_band || '',
        wifi_standard: value.wifi_standard || ''
      }),
    });
  }
}


    if (componentsData.length > 0) {
      await AssembledComponent.bulkCreate(componentsData);
    }

    // Step 3: Calculate purchase price and rent price per month with counts
    const productCountMap = {};
    componentsData.forEach((comp) => {
      if (comp.product_id) {
        const id = parseInt(comp.product_id);
        productCountMap[id] = (productCountMap[id] || 0) + 1; // count duplicates
      }
    });

    let totalPurchasePrice = 0;
    let totalPerMonthPrice = 0;

    if (Object.keys(productCountMap).length > 0) {
      const products = await ProductTemplete.findAll({
        where: { id: Object.keys(productCountMap) },
        attributes: ["id", "purchase_price", "rent_price_per_month"],
      });

      products.forEach((product) => {
        const count = productCountMap[product.id] || 1;
        const purchasePrice = parseFloat(product.purchase_price || 0);
        const rentPrice = parseFloat(product.rent_price_per_month || 0);

        totalPurchasePrice += purchasePrice * count;   // ✅ multiply by count
        totalPerMonthPrice += rentPrice * count;       // ✅ multiply by count
      });
    }

// Step 4: Create ProductTemplete
const productTempleteData = {
  product_category: "Assembled PC",
  product_id: generateRandomProductId(),
  assembled_id: assembledAsset.id,
  product_name: assembled_name,
  purchase_price: totalPurchasePrice,
  rent_price_per_month: totalPerMonthPrice, // ✅ Include this
  brand: 'Default Brand',
  grade: 'Default Grade',
  model: assembled_name,
  processor: components?.processor?.model || '',
  ram: components?.ram?.[0]?.size || '',
  ramType: components?.ram?.[0]?.type || '',
  storage: components?.storage?.[0]?.size || '',
  disk_type: components?.storage?.[0]?.type || '',
  ssd_type: components?.storage?.[0]?.type === 'SSD' ? components.storage[0].model : '',
  smps: components?.smps?.model || '',
  capacity: components?.smps?.wattage || '',
  wifi_standard: components?.wifi?.wifi_standard || '',
  frequency_band: components?.wifi?.frequency_band || '',
  graphics: components?.gpu?.model || '',
  os: components?.os || '',
  is_active: true,
  product_image: file?.filename || '',
  created_at: new Date(),
  updated_at: new Date(),
};

    await ProductTemplete.create(productTempleteData);

    return res.status(201).json({
      message: "Assembled PC created successfully!!",
      assembledAsset,
    });

  } catch (error) {
    console.error("Create failed:", error);
    res.status(500).json({
      message: "Create failed",
      error
    });
  }
};




// Get all AssembledAssets
export const getAllAssembledAssets = async (req, res) => {
  try {
    const assets = await AssembledAsset.findAll({
      include: [{
        model: AssembledComponent,
        as: "components"
      }],
      order: [
        ["id", "DESC"]
      ]
    });

    res.status(200).json(assets);
  } catch (error) {
    console.error("Fetch failed:", error);
    res.status(500).json({
      message: "Fetch failed",
      error
    });
  }
};

// Get single AssembledAsset by ID
export const getAssembledAssetById = async (req, res) => {
  try {
    const asset = await AssembledAsset.findByPk(req.params.id, {
      include: [{
        model: AssembledComponent,
        as: "components"
      }]
    });

    if (!asset) {
      return res.status(404).json({
        message: "Assembled Asset not found"
      });
    }

    res.status(200).json(asset);
  } catch (error) {
    console.error("Fetch failed:", error);
    res.status(500).json({
      message: "Fetch failed",
      error
    });
  }
};

// Update AssembledAsset and components
// Update AssembledAsset and components
export const updateAssembledAsset = async (req, res) => {
  try {
    const { id } = req.params; // assembled_id
    const file = req.file;
    const body = req.body;

    // Parse assembled_data JSON
    const assembledData = JSON.parse(body.assembled_data);

    const {
      assembled_name,
      parent_asset_id,
      components,
      is_active = true,
    } = assembledData;

    // Step 1: Find AssembledAsset
    const assembledAsset = await AssembledAsset.findByPk(id);
    if (!assembledAsset) {
      return res.status(404).json({ message: "Assembled Asset not found" });
    }

    // Step 2: Update AssembledAsset
    await assembledAsset.update({
      assembled_name,
      parent_asset_id,
      product_image: file?.filename || assembledAsset.product_image,
      is_active,
    });

    // Step 3: Handle Components (Update / Create / Delete missing ones)
    const incomingComponentIds = [];
    const componentsData = [];

    for (const [componentType, value] of Object.entries(components)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item.asset_id?.trim()) {
            const payload = {
              assembled_id: assembledAsset.id,
              component_type: componentType,
              ...item,
              product_id: item.product_id ? parseInt(item.product_id) : null,
              ...(componentType === "wifi" && {
                frequency_band: item.frequency_band || "",
                wifi_standard: item.wifi_standard || "",
              }),
            };

            if (item.id) {
              await AssembledComponent.update(payload, {
                where: { id: item.id, assembled_id: assembledAsset.id },
              });
              incomingComponentIds.push(item.id);
            } else {
              const created = await AssembledComponent.create(payload);
              incomingComponentIds.push(created.id);
            }

            componentsData.push(payload);
          }
        }
      } else if (value?.asset_id?.trim()) {
        const payload = {
          assembled_id: assembledAsset.id,
          component_type: componentType,
          ...value,
          product_id: value.product_id ? parseInt(value.product_id) : null,
          ...(componentType === "wifi" && {
            frequency_band: value.frequency_band || "",
            wifi_standard: value.wifi_standard || "",
          }),
        };

        if (value.id) {
          await AssembledComponent.update(payload, {
            where: { id: value.id, assembled_id: assembledAsset.id },
          });
          incomingComponentIds.push(value.id);
        } else {
          const created = await AssembledComponent.create(payload);
          incomingComponentIds.push(created.id);
        }

        componentsData.push(payload);
      }
    }

    // 🔥 Step 3.1: Delete removed components
    await AssembledComponent.destroy({
      where: {
        assembled_id: assembledAsset.id,
        id: { [Op.notIn]: incomingComponentIds },
      },
    });

    // Step 4: Recalculate purchase & rent prices (with counts)
    const productCounts = componentsData.reduce((acc, comp) => {
      if (comp.product_id) {
        acc[comp.product_id] = (acc[comp.product_id] || 0) + 1;
      }
      return acc;
    }, {});

    let totalPurchasePrice = 0;
    let totalPerMonthPrice = 0;

    if (Object.keys(productCounts).length > 0) {
      const products = await ProductTemplete.findAll({
        where: { id: Object.keys(productCounts) },
        attributes: ["id", "purchase_price", "rent_price_per_month"],
      });

      products.forEach((p) => {
        const count = productCounts[p.id] || 1;
        totalPurchasePrice += parseFloat(p.purchase_price || 0) * count;
        totalPerMonthPrice += parseFloat(p.rent_price_per_month || 0) * count;
      });
    }

    // Step 5: Update ProductTemplete
    const existingProduct = await ProductTemplete.findOne({
      where: { assembled_id: assembledAsset.id },
    });

    if (existingProduct) {
      await existingProduct.update({
        product_name: assembled_name,
        purchase_price: totalPurchasePrice,
        rent_price_per_month: totalPerMonthPrice,
        model: assembled_name,
        processor: components?.processor?.model || "",
        ram: components?.ram?.[0]?.size || "",
        ramType: components?.ram?.[0]?.type || "",
        storage: components?.storage?.[0]?.size || "",
        disk_type: components?.storage?.[0]?.type || "",
        ssd_type:
          components?.storage?.[0]?.type === "SSD"
            ? components.storage[0].model
            : "",
        smps: components?.smps?.model || "",
        capacity: components?.smps?.wattage || "",
        wifi_standard: components?.wifi?.wifi_standard || "",
        frequency_band: components?.wifi?.frequency_band || "",
        graphics: components?.gpu?.model || "",
        os: components?.os || "",
        is_active,
        product_image: file?.filename || existingProduct.product_image,
        updated_at: new Date(),
      });
    }

    return res.status(200).json({
      message: "Assembled PC updated successfully!!",
      assembledAsset,
      totalPurchasePrice,
      totalPerMonthPrice,
    });
  } catch (error) {
    console.error("Update failed:", error);
    res.status(500).json({
      message: "Update failed",
      error,
    });
  }
};




// Delete AssembledAsset and its related ProductTemplete entry
export const deleteAssembledAsset = async (req, res) => {
  try {
    const asset = await AssembledAsset.findByPk(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: "Assembled Asset not found" });
    }

    // Delete the associated ProductTemplete where assembled_id matches
    await ProductTemplete.destroy({
      where: { assembled_id: asset.id }
    });

    // Delete the AssembledAsset itself
    await asset.destroy();

    res.status(200).json({ message: "Assembled Asset and related ProductTemplete deleted" });
  } catch (error) {
    console.error("Delete failed:", error);
    res.status(500).json({ message: "Delete failed", error });
  }
};
