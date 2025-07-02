import db from '../models/index.js';
const { DeliveryChallan, DeliveryChallanItem,OrderItem,Order,ProductTemplete,Contact,GoodsReceiptItem  } = db;


// Create Delivery Challan
// Create Delivery Challan 
export const createDeliveryChallan = async (req, res) => {
  try {
    const {
      dc_id,
      dc_title,
      is_dc,
      order_id,
      customer_code,
      order_number,
      dc_date,
      dc_status,
      dealer_reference,
      email,
      gst_number,
      pan_number,
      remarks,
      dc_file,
      type,
      payment_type,
      regular_dc,
      industry,
      shipping_ordered_by,
      shipping_phone_number,
      shipping_name,
      street,
      landmark,
      pincode,
      city,
      state,
      country,
      vehicle_number,
      delivery_person_name,
      delivery_person_phone_number,
      receiver_name,
      receiver_phone_number,
      items
    } = req.body;

    const deliveryChallan = await DeliveryChallan.create({
      dc_id,
      dc_title,
      is_dc,
      order_id,
      customer_code,
      order_number,
      dc_date,
      dc_status,
      dealer_reference,
      email,
      gst_number,
      pan_number,
      remarks,
      dc_file,
      type,
      payment_type,
      regular_dc,
      industry,
      shipping_ordered_by,
      shipping_phone_number,
      shipping_name,
      street,
      landmark,
      pincode,
      city,
      state,
      country,
      vehicle_number,
      delivery_person_name,
      delivery_person_phone_number,
      receiver_name,
      receiver_phone_number
    });

    if (items && Array.isArray(items)) {
      const formattedItems = items.map(item => ({
        ...item,
        challan_id: deliveryChallan.id,
        device_ids: JSON.stringify(item.device_ids || []) // ✅ Ensure device_ids stored as JSON
      }));
      await DeliveryChallanItem.bulkCreate(formattedItems);
    }

    res.status(201).json({ message: 'Delivery Challan created successfully', deliveryChallan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating delivery challan', error });
  }
};


// Get All Delivery Challans
export const getAllDeliveryChallans = async (req, res) => {
  try {
    const deliveryChallans = await DeliveryChallan.findAll({
      include: [{
        model: DeliveryChallanItem,
        as: 'items', // <-- use the alias
      }],
    });
    res.status(200).json(deliveryChallans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching delivery challans', error });
  }
};
export const getAllDeliveryChallanDelivered = async (req, res) => {
  try {
    // Step 1: Get GRN items
    const grnItems = await GoodsReceiptItem.findAll({
      attributes: ['product_id', 'asset_ids']
    });

    // Step 2: Get used device_ids from delivered challans
    const usedItems = await DeliveryChallanItem.findAll({
      include: [
        {
          model: DeliveryChallan,
          as: 'challan',
          where: { dc_status: 'Delivered' },
          attributes: []
        }
      ],
      attributes: ['product_id', 'device_ids']
    });

    // Step 3: Map used devices
    const usedDeviceMap = {};
    for (const item of usedItems) {
      const productId = item.product_id;
      const deviceIds = typeof item.device_ids === 'string'
        ? JSON.parse(item.device_ids || '[]')
        : item.device_ids || [];

      if (!usedDeviceMap[productId]) usedDeviceMap[productId] = new Set();
      deviceIds.forEach(id => usedDeviceMap[productId].add(id));
    }

    // Step 4: Available devices = GRN - Used
    const availableDeviceMap = {};
    for (const grn of grnItems) {
      const productId = grn.product_id;
      const assetIds = typeof grn.asset_ids === 'string'
        ? JSON.parse(grn.asset_ids || '[]')
        : grn.asset_ids || [];

      const used = usedDeviceMap[productId] || new Set();
      const remaining = assetIds.filter(id => !used.has(id));
      availableDeviceMap[productId] = remaining;
    }

    // Step 5: Fetch all delivered challans with associations
    const allDeliveryChallans = await DeliveryChallan.findAll({
      where: { dc_status: 'Delivered' },
      include: [
        {
          model: DeliveryChallanItem,
          as: 'items',
          include: [
            {
              model: ProductTemplete,
              as: 'product'
            }
          ]
        },
        {
          model: Contact,
          as: 'customer',
          attributes: [
            'id',
            'first_name',
            'last_name',
            'customer_id',
            'email',
            'phone_number',
            'company_name',
            'gst',
            'pan_no',
            'address'
          ],
          required: false
        },
        {
          model: Order,
          as: 'order',
          attributes: [
            'id',
            'customer_id',
            'rental_start_date',
            'rental_end_date',
            'rental_duration',
            'rental_duration_in_months',
            'rental_duration_days'
          ],
          required: false
        }
      ],
      order: [['id', 'DESC']] // Most recent first
    });

    // Step 6: Keep only latest challan per customer_code
    const seenCustomerCodes = new Set();
    const uniqueDeliveryChallans = [];

    for (const dc of allDeliveryChallans) {
      const customerCode = dc.customer_code;
      if (!seenCustomerCodes.has(customerCode)) {
        // Attach available_device_ids to each item
        for (const item of dc.items) {
          item.dataValues.available_device_ids = availableDeviceMap[item.product_id] || [];
        }

        uniqueDeliveryChallans.push(dc);
        seenCustomerCodes.add(customerCode);
      }
    }

    res.status(200).json(uniqueDeliveryChallans);
  } catch (error) {
    console.error('Error fetching unique delivered DCs:', error);
    res.status(500).json({
      message: 'Error fetching delivered delivery challans',
      error
    });
  }
};




// Get Delivery Challan by ID
export const getDeliveryChallanById = async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Get Delivery Challan with items and their products
    const deliveryChallan = await DeliveryChallan.findByPk(id, {
      include: [
        {
          model: DeliveryChallanItem,
          as: 'items',
          include: [
            {
              model: ProductTemplete,
              as: 'product',
            },
          ],
        },
      ],
    });

    if (!deliveryChallan) {
      return res.status(404).json({ message: 'Delivery Challan not found' });
    }

    const deliveryChallanData = deliveryChallan.toJSON();

    // Step 2: Add device_ids from OrderItem for each product in the delivery challan
    const enrichedItems = await Promise.all(
      deliveryChallanData.items.map(async (item) => {
        const orderItem = await OrderItem.findOne({
          where: {
            order_id: deliveryChallanData.order_id,
            product_id: item.product_id,
          },
        });

        return {
          ...item,
          device_ids: orderItem?.device_ids || [],
        };
      })
    );

    // Step 3: Calculate totals
    const totalQuantity = enrichedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = enrichedItems.reduce(
      (sum, item) => sum + parseFloat(item.total_price || 0),
      0
    );

    // Step 4: Final Response
    const response = {
      ...deliveryChallanData,
      items: enrichedItems, // with product and device_ids, no product_details
      totalQuantity,
      totalPrice,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching delivery challan:', error);
    res.status(500).json({ message: 'Error fetching delivery challan', error });
  }
};

// Update Delivery Challan
export const updateDeliveryChallan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      dc_title,
      is_dc,
      order_id,
      customer_code,
      order_number,
      dc_date,
      dc_status,
      dealer_reference,
      email,
      gst_number,
      pan_number,
      remarks,
      dc_file,
      type,
      payment_type,
      regular_dc,
      industry,
      shipping_ordered_by,
      shipping_phone_number,
      shipping_name,
      street,
      landmark,
      pincode,
      city,
      state,
      country,
      vehicle_number,
      delivery_person_name,
      delivery_person_phone_number,
      receiver_name,
      receiver_phone_number,
      items
    } = req.body;

    const deliveryChallan = await DeliveryChallan.findByPk(id);
    if (!deliveryChallan) return res.status(404).json({ message: 'Delivery Challan not found' });

    await deliveryChallan.update({
      dc_title,
      is_dc,
      order_id,
      customer_code,
      order_number,
      dc_date,
      dc_status,
      dealer_reference,
      email,
      gst_number,
      pan_number,
      remarks,
      dc_file,
      type,
      payment_type,
      regular_dc,
      industry,
      shipping_ordered_by,
      shipping_phone_number,
      shipping_name,
      street,
      landmark,
      pincode,
      city,
      state,
      country,
      vehicle_number,
      delivery_person_name,
      delivery_person_phone_number,
      receiver_name,
      receiver_phone_number,
      updated_at: new Date()
    });

    // Update DeliveryChallanItems
    if (items && Array.isArray(items)) {
      await DeliveryChallanItem.destroy({ where: { challan_id: id } });

      const formattedItems = items.map(item => ({
        ...item,
        challan_id: id,
        device_ids: JSON.stringify(item.device_ids || []) // ✅ Ensure device_ids stored as JSON
      }));

      await DeliveryChallanItem.bulkCreate(formattedItems);
    }

    res.status(200).json({ message: 'Delivery Challan updated successfully', deliveryChallan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating delivery challan', error });
  }
};


// Delete Delivery Challan
export const deleteDeliveryChallan = async (req, res) => {
  try {
    const { id } = req.params;
    const deliveryChallan = await DeliveryChallan.findByPk(id);
    if (!deliveryChallan) return res.status(404).json({ message: 'Delivery Challan not found' });

    await DeliveryChallanItem.destroy({ where: { challan_id: id } });
    await deliveryChallan.destroy();

    res.status(200).json({ message: 'Delivery Challan and related items deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting delivery challan', error });
  }
};
