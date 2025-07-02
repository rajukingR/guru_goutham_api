import db from '../models/index.js';
const {
  GRN,
  GRNItem,
  ProductTemplete,
  Contact,
  Order,
  OrderItem,
   Invoice,
   InvoiceItem ,
   GoodsReceiptItem,
} = db;

export const createGRN = async (req, res) => {
  try {
    const {
      grn_id,
      grn_title,
      order_id,
      customer_id,
      customer_select,
      email_id,
      grn_date,
      gst_number,
      pan,
      grn_created_by,
      industry,
      company_name,
      country,
      state,
      city,
      street,
      landmark,
      pincode,
      informed_person_name,
      informed_person_phone_no,
      returner_name,
      returner_phone_no,
      receiver_name,
      receiver_phone_no,
      description,
      grn_status,
      vehicle_number,
      invoice_number,
      products: items // ✅ Renaming from products to items
    } = req.body;

    const grn = await GRN.create({
      grn_number: grn_id,
      grn_title,
      order_id,
      customer_id,
      customer_name: customer_select,
      email: email_id,
      phone_number: informed_person_phone_no,
      grn_date,
      gst_number,
      pan_number: pan,
      grn_created_by,
      industry,
      company_name,
      country,
      state,
      city,
      street,
      landmark,
      pincode,
      informed_person_name,
      informed_person_phone: informed_person_phone_no,
      returner_name,
      returner_phone: returner_phone_no,
      receiver_name,
      receiver_phone: receiver_phone_no,
      description,
      grn_status,
      vehicle_number,
      invoice_number: order_id
    });

    if (items && Array.isArray(items)) {
      const formattedItems = items.map(item => ({
        grn_id: grn.id,
        product_id: item.product_id,
        product_name: item.product_name,
        device_ids: JSON.stringify(item.device_ids),
        quantity: item.quantity,
        unit_price: parseFloat(item.price),
        total_price: parseFloat(item.price) * item.quantity,
      }));
      await GRNItem.bulkCreate(formattedItems);
    }

    res.status(201).json({
      message: 'GRN created successfully',
      grn
    });
  } catch (error) {
    console.error('Create GRN error:', error);
    res.status(500).json({
      message: 'Error creating GRN',
      error
    });
  }
};


// Update GRN
export const updateGRN = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const {
      grn_number,
      grn_title,
      order_id,
      customer_id,
      customer_name,
      email,
      phone_number,
      grn_date,
      gst_number,
      pan_number,
      grn_created_by,
      industry,
      company_name,
      country,
      state,
      city,
      street,
      landmark,
      pincode,
      informed_person_name,
      informed_person_phone,
      returner_name,
      returner_phone,
      receiver_name,
      receiver_phone,
      description,
      grn_status,

      vehicle_number,
      invoice_number,
      items
    } = req.body;

    const grn = await GRN.findByPk(id);
    if (!grn) return res.status(404).json({
      message: 'GRN not found'
    });

    await grn.update({
      grn_number,
      grn_title,
      order_id,
      customer_id,
      customer_name,
      email,
      phone_number,
      grn_date,
      gst_number,
      pan_number,
      grn_created_by,
      industry,
      company_name,
      country,
      state,
      city,
      street,
      landmark,
      pincode,
      informed_person_name,
      informed_person_phone,
      returner_name,
      returner_phone,
      receiver_name,
      receiver_phone,
      description,
      grn_status,

      vehicle_number,
      invoice_number,
      updated_at: new Date()
    });

    if (items && Array.isArray(items)) {
      // Delete old GRN items
      await GRNItem.destroy({
        where: {
          grn_id: id
        }
      });

      // Create new GRN items
      const formattedItems = items.map(item => ({
        ...item,
        grn_id: id,
      }));
      await GRNItem.bulkCreate(formattedItems);
    }

    res.status(200).json({
      message: 'GRN updated successfully',
      grn
    });
  } catch (error) {
    console.error('Update GRN error:', error);
    res.status(500).json({
      message: 'Error updating GRN',
      error
    });
  }
};


// Get All GRNs
export const getAllGRNs = async (req, res) => {
  try {
    const grns = await GRN.findAll({
      include: [{
        model: GRNItem,
        as: 'items',
        include: [{
          model: ProductTemplete,
          as: 'product' // 👈 MATCH THE ALIAS in GRNItem.belongsTo
        }]
      }]
    });

    res.status(200).json(grns);
  } catch (error) {
    console.error('Fetch GRNs failed:', error);
    res.status(500).json({
      message: 'Error fetching GRNs',
      error
    });
  }
};




export const getAllApprovedGRNs = async (req, res) => {
  try {
    // 1. Get all device IDs used in approved invoices
    const approvedInvoices = await Invoice.findAll({
      where: { approval_status: 'Approved' },
      include: [{ model: InvoiceItem, as: 'items' }],
    });

    const usedDeviceIdsSet = new Set();

    approvedInvoices.forEach((invoice) => {
      invoice.items?.forEach((item) => {
        const collectIds = (raw) => {
          if (!raw) return [];
          if (typeof raw === 'string') {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) return parsed.map((id) => String(id).trim());
              return raw.split(',').map((id) => id.trim());
            } catch {
              return raw.split(',').map((id) => id.trim());
            }
          } else if (Array.isArray(raw)) {
            return raw.map((id) => String(id).trim());
          }
          return [];
        };

        const ids = [
          ...collectIds(item.device_ids),
          ...collectIds(item.returned_device_ids),
          ...collectIds(item.new_device_ids),
        ];

        ids.forEach((id) => usedDeviceIdsSet.add(id));
      });
    });

    // 2. Get all asset IDs from goods_receipt_items grouped by product_id
    const goodsReceiptItems = await GoodsReceiptItem.findAll();
    const assetIdsByProductId = {};

    goodsReceiptItems.forEach((item) => {
      const productId = item.product_id;
      let assetIds = [];

      if (typeof item.asset_ids === 'string') {
        try {
          const parsed = JSON.parse(item.asset_ids);
          assetIds = Array.isArray(parsed)
            ? parsed.map((id) => String(id).trim())
            : item.asset_ids.split(',').map((id) => id.trim());
        } catch {
          assetIds = item.asset_ids.split(',').map((id) => id.trim());
        }
      } else if (Array.isArray(item.asset_ids)) {
        assetIds = item.asset_ids.map((id) => String(id).trim());
      }

      if (!assetIdsByProductId[productId]) {
        assetIdsByProductId[productId] = new Set();
      }

      assetIds.forEach((id) => assetIdsByProductId[productId].add(id));
    });

    // 3. Fetch all approved GRNs with items and order details
    const grns = await GRN.findAll({
      where: { grn_status: 'Approved' },
      include: [
        {
          model: GRNItem,
          as: 'items',
          include: [{ model: ProductTemplete, as: 'product' }],
        },
        {
          model: Order,
          as: 'order',
          attributes: ['rental_duration_in_months', 'rental_start_date', 'rental_end_date'],
        },
      ],
    });

    // 4. Process GRNs and add remaining_device_ids
    const enrichedGRNs = await Promise.all(
      grns.map(async (grn) => {
        const grnJSON = grn.toJSON();
        const customer = await Contact.findByPk(grn.customer_id);

        const updatedItems = grnJSON.items.map((item) => {
          let deviceIds = [];

          if (typeof item.device_ids === 'string') {
            try {
              const parsed = JSON.parse(item.device_ids);
              deviceIds = Array.isArray(parsed)
                ? parsed.map((id) => String(id).trim())
                : item.device_ids.split(',').map((id) => id.trim());
            } catch {
              deviceIds = item.device_ids.split(',').map((id) => id.trim());
            }
          } else if (Array.isArray(item.device_ids)) {
            deviceIds = item.device_ids.map((id) => String(id).trim());
          }

          // Get all original asset IDs for this product
          const originalAssetIds = assetIdsByProductId[item.product_id] || new Set();

          // Calculate remaining device IDs
          const remainingDeviceIds = Array.from(originalAssetIds).filter(
            (id) => !usedDeviceIdsSet.has(id)
          );

          return {
            ...item,
            remaining_device_ids: remainingDeviceIds,
          };
        });

        return {
          ...grnJSON,
          items: updatedItems,
          customer_details: customer || null,
        };
      })
    );

    res.status(200).json(enrichedGRNs);
  } catch (error) {
    console.error('Error fetching approved GRNs:', error);
    res.status(500).json({ message: 'Error fetching approved GRNs', error });
  }
};

// Get GRN by ID
export const getGRNById = async (req, res) => {
  try {
    const {
      id
    } = req.params;

    const grn = await GRN.findByPk(id, {
      include: [{
        model: GRNItem,
        as: 'items',
        include: [{
          model: ProductTemplete,
          as: 'product' // This must match the alias in GRNItem.belongsTo(ProductTemplete, { as: 'product', ... })
        }]
      }]
    });

    if (!grn) {
      return res.status(404).json({
        message: 'GRN not found'
      });
    }

    res.status(200).json(grn);
  } catch (error) {
    console.error('Fetch GRN by ID failed:', error);
    res.status(500).json({
      message: 'Error fetching GRN',
      error
    });
  }
};




// Delete GRN
export const deleteGRN = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const grn = await GRN.findByPk(id);
    if (!grn) return res.status(404).json({
      message: 'GRN not found'
    });

    await GRNItem.destroy({
      where: {
        grn_id: id
      }
    });
    await grn.destroy();

    res.status(200).json({
      message: 'GRN and related items deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error deleting GRN',
      error
    });
  }
};