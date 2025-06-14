import db from '../models/index.js';
const { DeliveryChallan, DeliveryChallanItem,OrderItem,ProductTemplete  } = db;


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
      const formattedItems = items.map(item => ({ ...item, challan_id: deliveryChallan.id }));
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
      const formattedItems = items.map(item => ({ ...item, challan_id: id }));
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
