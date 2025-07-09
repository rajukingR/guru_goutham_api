import db from '../models/index.js';

const AssetId = db.AssetId;
const Invoice = db.Invoice;
const InvoiceItem = db.InvoiceItem;
const ProductTemplete = db.ProductTemplete;

// ✅ Helper to normalize returned_device_ids
function parseReturnedDeviceIds(raw) {
  return Array.isArray(raw) ? raw.map(id => id.trim()) : [];
}

export const getAllAssetModifications = async (req, res) => {
  try {
    // 🔹 Step 1: Fetch returned device IDs from invoice_items
    const invoiceItems = await InvoiceItem.findAll({
      attributes: ['invoice_id', 'product_id', 'returned_device_ids']
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
      include: [
        { model: Invoice, as: 'invoice' },
        { model: ProductTemplete, as: 'product' }
      ],
      order: [['updated_at', 'DESC']]
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
          order_id:asset.invoice?.order_id || "",
          invoice_number: asset.invoice?.invoice_number || '',
          customer_id:asset.invoice?.customer_id || "",
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
    const assets = await AssetId.findAll();
    res.status(200).json(assets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching asset IDs", error });
  }
};

// Get single Asset ID by ID
export const getAssetIdsByProductId = async (req, res) => {
  try {
    const { id } = req.params;

    const assets = await db.AssetId.findAll({
      where: { product_id: id },
    });

    if (!assets || assets.length === 0) {
      return res.status(404).json({ message: "No assets found for this product" });
    }

    res.status(200).json(assets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching asset IDs by product ID", error });
  }
};
