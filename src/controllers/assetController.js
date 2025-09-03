import db from '../models/index.js';
import {
  Op
} from "sequelize";

const AssetId = db.AssetId;
const Invoice = db.Invoice;
const InvoiceItem = db.InvoiceItem;
const ProductTemplete = db.ProductTemplete;
const AssetIdComponent = db.AssetIdComponent;

// ✅ Helper to normalize returned_device_ids
function parseReturnedDeviceIds(raw) {
  return Array.isArray(raw) ? raw.map(id => id.trim()) : [];
}

export const getAllAssetModifications = async (req, res) => {
  try {
    // 🔹 Step 1: Fetch returned device IDs from invoice_items
    const invoiceItems = await InvoiceItem.findAll({
      attributes: ['invoice_id', 'product_id', 'returned_device_ids'],
    });

    const returnedSet = new Set();

    for (const item of invoiceItems) {
      console.log("Raw returned_device_ids (from DB):", item.returned_device_ids);

      const returnedIds = parseReturnedDeviceIds(item.returned_device_ids);
      console.log("✅ Final returned IDs:", returnedIds);

      for (const aid of returnedIds) {
        if (aid) returnedSet.add(`${item.invoice_id}|${aid}`);
      }
    }

    console.log("✅ All returned device keys:", Array.from(returnedSet));

    // 🔹 Step 2: Fetch all asset records
    const assets = await AssetId.findAll({
      include: [{
          model: Invoice,
          as: 'invoice'
        },
        {
          model: ProductTemplete,
          as: 'product'
        }
      ],
      order: [
        ['updated_at', 'DESC']
      ]
    });

    // 🔹 Step 3: Group assets by invoice, exclude returned devices
    const grouped = {};

    for (const asset of assets) {
      const invoiceId = asset.invoice_id;
      const assetId = asset.asset_id?.trim();
      const key = `${invoiceId}|${assetId}`;

      if (returnedSet.has(key)) {
        console.log(`⛔ Skipping returned asset: ${key}`);
        continue;
      }

      if (!grouped[invoiceId]) {
        grouped[invoiceId] = {
          invoice_id: invoiceId,
          order_id: asset.invoice?.order_id || "",
          invoice_number: asset.invoice?.invoice_number || '',
          customer_id: asset.invoice?.customer_id || "",
          customer_name: asset.invoice?.customer_name || "",
          invoice_date: asset.invoice?.invoice_date || '',
          assets: []
        };
      }



      grouped[invoiceId].assets.push({
        id: asset.id,
        asset_id: assetId,
        product_id: asset.product_id,
        product_name: asset.product_name,
        ram: asset.ram,
        storage: asset.storage,
        new_ram: asset.new_ram,
        new_storage: asset.new_storage,
        processor: asset.processor,
        os: asset.os,
        graphics: asset.graphics,
        disk_type: asset.disk_type,
        brand: asset.brand,
        model: asset.model,
        grade: asset.grade,
        screen_size: asset.screen_size,
        resolution: asset.resolution,
        brightness: asset.brightness,
        power_consumption: asset.power_consumption,
        display_device: asset.display_device,
        audio_output: asset.audio_output,
        weight: asset.weight,
        color: asset.color,
        created_at: asset.created_at,
        updated_at: asset.updated_at
      });
    }

    // 🔹 Step 4: Return grouped results
    res.status(200).json({

      data: Object.values(grouped)
    });

  } catch (error) {
    console.error('❌ Error fetching asset modifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset modifications',
      error: error.message
    });
  }
};


export const getAllAssetIds = async (req, res) => {
  try {
    const assetIds = await AssetId.findAll({
      include: [{
          model: ProductTemplete,
          as: "product",
          attributes: ["id", "product_name", "product_category"],
          where: {
            product_category: {
              [Op.or]: ["Laptops", "Assembled PC"],
            },
          },
        },
        {
          model: AssetIdComponent,
          as: "components",
          attributes: [
            "id",
            "component_type",
            "asset_id",
            "product_id",
            "type",
            "brand",
            "model",
            "size",
            "asset_modification_id"
          ],
        },
      ],
    });

    const transformed = assetIds.map(asset => {
      const rams = asset.components.filter(c => c.component_type === "ram");
      const storages = asset.components.filter(c => c.component_type === "storage");
      const processors = asset.components.filter(c => c.component_type === "processor");

      return {
        id: asset.id,
        asset_id: asset.asset_id,
        product_id: asset.product_id,
        product_name: asset.product?.product_name,
        product_category: asset.product?.product_category,

        // ✅ Take from AssetIdComponent if present, else fallback to AssetId table
        ram_sizes: rams.length > 0 ?
          rams.map(r => r.size).filter(Boolean) :
          asset.ram ? [asset.ram] : [],

        storage_sizes: storages.length > 0 ?
          storages.map(s => s.size).filter(Boolean) :
          asset.storage ? [asset.storage] : [],

        processor_models: processors.length > 0 ?
          processors.map(p => p.model).filter(Boolean) :
          asset.processor ? [asset.processor] : [],

        // Full details (with fallback)
        rams: rams.length > 0 ?
          rams.map((c, i) => ({
            ...c.toJSON(),
            label: `RAM${i + 1}`
          })) :
          asset.ram ? [{
            size: asset.ram,
            label: "RAM1 (base)"
          }] : [],

        storages: storages.length > 0 ?
          storages.map((c, i) => ({
            ...c.toJSON(),
            label: `STORAGE${i + 1}`
          })) :
          asset.storage ? [{
            size: asset.storage,
            label: "STORAGE1 (base)"
          }] : [],

        processors: processors.length > 0 ?
          processors.map((c, i) => ({
            ...c.toJSON(),
            label: `PROCESSOR${i + 1}`
          })) :
          asset.processor ? [{
            model: asset.processor,
            label: "PROCESSOR1 (base)"
          }] : [],
      };
    });

    res.status(200).json(transformed);
  } catch (error) {
    console.error("Error fetching asset IDs:", error);
    res.status(500).json({
      message: "Error fetching asset IDs",
      error
    });
  }
};





// Get single Asset ID by ID
// Get single Asset ID by ID
export const getAssetIdsByProductId = async (req, res) => {
  try {
    const {
      id
    } = req.params;

    const asset = await db.AssetId.findOne({
      where: {
        id
      },
      attributes: [
        'id',
        'invoice_id',
        'product_id',
        'asset_id',
        'product_name',
        'ram',
        'storage',
      ],
      include: [{
        model: db.AssetIdComponent,
        as: "components", // ✅ must match association
        attributes: [
          'id',
          'asset_modification_id',
          'product_id',
          'component_type',
          'type',
          'brand',
          'model',
          'size',
          'asset_id',
        ]
      }]
    });

    if (!asset) {
      return res.status(404).json({
        message: "No asset found with this ID"
      });
    }

    res.status(200).json(asset);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching asset IDs by product ID",
      error
    });
  }
};





export const updateAssetComponents = async (req, res) => {
  try {
    const {
      id
    } = req.params; // This is asset_modification_id (AssetId.id)
    const data = req.body.asset_modification_data;

    // 1. Remove old components linked to this asset_modification_id
    await AssetIdComponent.destroy({
      where: {
        asset_modification_id: id
      }
    });

    // 2. Prepare new components from payload (array of objects)
    const components = [];

    if (Array.isArray(data.components)) {
      data.components.forEach(comp => {
        components.push({
          asset_modification_id: id, // inject FK here
          asset_id: comp.asset_id,
          product_id: comp.product_id,
          component_type: comp.component_type, // "ram" | "storage" | "processor"
          type: comp.type || null,
          brand: comp.brand || null,
          model: comp.model || null,
          size: comp.size || null
        });
      });
    }

    // 3. Bulk insert
    if (components.length > 0) {
      await AssetIdComponent.bulkCreate(components);
    }

    return res.json({
      message: "Components updated successfully",
      components
    });

  } catch (error) {
    console.error("Update Asset Components Error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};