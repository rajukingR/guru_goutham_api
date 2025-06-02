import db from '../models/index.js';

const Service = db.Service;

// Create new service
export const createService = async (req, res) => {
  try {
    const serviceData = req.body;

    // Check if service with same product_id already exists (if needed)
    const existingService = await Service.findOne({ where: { product_id: serviceData.product_id } });
    if (existingService) {
      return res.status(400).json({ message: 'Service with this product ID already exists' });
    }

    const service = await Service.create(serviceData);
    res.status(201).json({ message: 'Service created successfully', service });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating service', error });
  }
};

// Get all services
export const getAllServices = async (req, res) => {
  try {
    const services = await Service.findAll();
    res.status(200).json(services);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching services', error });
  }
};

// Get service by ID
export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id);

    if (!service) return res.status(404).json({ message: 'Service not found' });

    res.status(200).json(service);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching service', error });
  }
};

// Update service
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const serviceData = req.body;

    const service = await Service.findByPk(id);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    // Check for unique product_id if updating
    if (serviceData.product_id && serviceData.product_id !== service.product_id) {
      const existingService = await Service.findOne({ where: { product_id: serviceData.product_id } });
      if (existingService) {
        return res.status(400).json({ message: 'Service with this product ID already exists' });
      }
    }

    await service.update({
      ...serviceData,
      updated_at: new Date(), // Add this if you have an updated_at field
    });

    res.status(200).json({ message: 'Service updated successfully', service });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating service', error });
  }
};

// Delete service
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id);

    if (!service) return res.status(404).json({ message: 'Service not found' });

    await service.destroy();
    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting service', error });
  }
};