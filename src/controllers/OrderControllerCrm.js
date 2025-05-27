import db from '../models/index.js';
const { Order, OrderItem, OrderAddress, OrderPersonalDetail } = db;

// Create Order
export const createOrder = async (req, res) => {
  try {
    const {
      order_id,
      order_title,
      quotation_id,
      transaction_type,
      payment_type,
      order_status,
      source_of_entry,
      owner,
      remarks,
      order_generated_by,
      rental_duration,
      rental_start_date,
      rental_end_date,
      order_date,
      contact_status,
      personal_details,
      address,
      items
    } = req.body;

    const order = await Order.create({
      order_id,
      order_title,
      quotation_id,
      transaction_type,
      payment_type,
      order_status,
      source_of_entry,
      owner,
      remarks,
      order_generated_by,
      rental_duration,
      rental_start_date,
      rental_end_date,
      order_date,
      contact_status
    });

    if (personal_details) {
      await OrderPersonalDetail.create({
        ...personal_details,
        order_id: order.id
      });
    }

    if (address) {
      await OrderAddress.create({
        ...address,
        order_id: order.id
      });
    }

    if (items && Array.isArray(items)) {
      const formattedItems = items.map(item => ({ ...item, order_id: order.id }));
      await OrderItem.bulkCreate(formattedItems);
    }

    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating order', error });
  }
};

// Get All Orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [OrderItem, OrderAddress, OrderPersonalDetail]
    });
    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching orders', error });
  }
};

// Get Order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [OrderItem, OrderAddress, OrderPersonalDetail]
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching order', error });
  }
};

// Update Order
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      order_title,
      transaction_type,
      payment_type,
      order_status,
      source_of_entry,
      owner,
      remarks,
      order_generated_by,
      rental_duration,
      rental_start_date,
      rental_end_date,
      order_date,
      contact_status,
      personal_details,
      address,
      items
    } = req.body;

    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await order.update({
      order_title,
      transaction_type,
      payment_type,
      order_status,
      source_of_entry,
      owner,
      remarks,
      order_generated_by,
      rental_duration,
      rental_start_date,
      rental_end_date,
      order_date,
      contact_status,
      updated_at: new Date()
    });

    // Update associated models
    if (personal_details) {
      const personalDetail = await OrderPersonalDetail.findOne({ where: { order_id: id } });
      if (personalDetail) {
        await personalDetail.update(personal_details);
      } else {
        await OrderPersonalDetail.create({ ...personal_details, order_id: id });
      }
    }

    if (address) {
      const orderAddress = await OrderAddress.findOne({ where: { order_id: id } });
      if (orderAddress) {
        await orderAddress.update(address);
      } else {
        await OrderAddress.create({ ...address, order_id: id });
      }
    }

    if (items && Array.isArray(items)) {
      // Delete old items and recreate
      await OrderItem.destroy({ where: { order_id: id } });
      const formattedItems = items.map(item => ({ ...item, order_id: id }));
      await OrderItem.bulkCreate(formattedItems);
    }

    res.status(200).json({ message: 'Order updated successfully', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating order', error });
  }
};

// Delete Order
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await OrderItem.destroy({ where: { order_id: id } });
    await OrderAddress.destroy({ where: { order_id: id } });
    await OrderPersonalDetail.destroy({ where: { order_id: id } });
    await order.destroy();

    res.status(200).json({ message: 'Order and related data deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting order', error });
  }
};
