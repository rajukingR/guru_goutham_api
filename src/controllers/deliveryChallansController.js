import db from '../models/index.js';
const { DeliveryChallan, DeliveryChallanItem,OrderItem,Order,DispatchOrder,ProductTemplete,Contact,GoodsReceiptItem  } = db;

const CreditNote = db.CreditNote;
const CreditNoteItem = db.CreditNoteItem;

// Create Delivery Challan
// Create Delivery Challan 
export const createDeliveryChallan = async (req, res) => {
  try {
    const {
      dc_id,
      dc_title,
      is_dc,
      order_id,
      dispatch_order_id,
      dispatch_order_number,
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
      dispatch_order_id:order_id,
      dispatch_order_number,
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
    // Step 1: Fetch all CreditNotes and CreditNoteItems
    const allCreditNotes = await CreditNote.findAll({
      include: [{ model: CreditNoteItem, as: 'items' }]
    });

    // Step 2: Build a map of returned devices by dc_id and product_id
    const returnedDeviceMap = {};
    for (const note of allCreditNotes) {
      const dcId = Number(note.dc_id);
      if (!returnedDeviceMap[dcId]) returnedDeviceMap[dcId] = {};

      for (const item of note.items) {
        const productId = item.product_id;
        const returnedDevices = Array.isArray(item.device_ids)
          ? item.device_ids
          : JSON.parse(item.device_ids || '[]');

        if (!returnedDeviceMap[dcId][productId]) {
          returnedDeviceMap[dcId][productId] = new Set();
        }

        returnedDevices.forEach(id => returnedDeviceMap[dcId][productId].add(id));
      }
    }

    // Step 3: Fetch Delivered DCs with full associations
    const allDeliveryChallans = await DeliveryChallan.findAll({
      where: { dc_status: 'Delivered' },
      include: [
        {
          model: DeliveryChallanItem,
          as: 'items',
          include: [{ model: ProductTemplete, as: 'product' }]
        },
        {
          model: Contact,
          as: 'customer',
          attributes: [
            'id', 'first_name', 'last_name', 'customer_id',
            'email', 'phone_number', 'company_name', 'gst',
            'pan_no', 'address'
          ],
          required: false
        },
        {
          model: DispatchOrder,
          as: 'dispatch_order',
          required: false
        }
      ],
      order: [['id', 'DESC']]
    });

    // Step 4: Adjust each item's device_ids and quantity
    for (const dc of allDeliveryChallans) {
      const dcId = dc.id;

      for (const item of dc.items) {
        const productId = item.product_id;

        const deviceIds = Array.isArray(item.device_ids)
          ? item.device_ids
          : JSON.parse(item.device_ids || '[]');

        const returnedSet = returnedDeviceMap[dcId]?.[productId] ?? new Set();

        const filteredDeviceIds = deviceIds.filter(id => !returnedSet.has(id));

        // ✅ Update the item
        item.device_ids = filteredDeviceIds;
        item.quantity = filteredDeviceIds.length;
      }
    }

    return res.status(200).json(allDeliveryChallans);
  } catch (error) {
    console.error('Error fetching delivered DCs:', error);
    return res.status(500).json({
      message: 'Error fetching delivered delivery challans',
      error: error.message
    });
  }
};







export const getDeliveryChallanById = async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Fetch delivery challan with items and products
    const deliveryChallan = await DeliveryChallan.findByPk(id, {
      include: [
        {
          model: DeliveryChallanItem,
          as: "items",
          include: [
            {
              model: ProductTemplete,
              as: "product",
            },
          ],
        },
      ],
    });

    if (!deliveryChallan) {
      return res.status(404).json({ message: "Delivery Challan not found" });
    }

    const deliveryChallanData = deliveryChallan.toJSON();

    // Step 2: Parse device_ids if needed (already handled in model's getter)
    const enrichedItems = deliveryChallanData.items.map((item) => {
      // Sequelize model getter already parses JSON
      return {
        ...item,
        device_ids: item.device_ids || [],
      };
    });

    // Step 3: Calculate totals
    const totalQuantity = enrichedItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
    const totalPrice = enrichedItems.reduce(
      (sum, item) => sum + parseFloat(item.total_price || 0),
      0
    );

    // Step 4: Return response
    return res.status(200).json({
      ...deliveryChallanData,
      items: enrichedItems,
      totalQuantity,
      totalPrice,
    });
  } catch (error) {
    console.error("Error fetching delivery challan:", error);
    return res.status(500).json({
      message: "Internal server error",
      error,
    });
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
      dispatch_order_number,
      dispatch_order_id,
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
      dispatch_order_number:order_id,
      dispatch_order_id,
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
