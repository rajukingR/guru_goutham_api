// controllers/ServiceStatusController.js
import db from '../models/index.js';

const ServiceStatus = db.ServiceStatus;

// Create new Service Status
export const createServiceStatus = async (req, res) => {
  try {
    const { service_status, description, is_active } = req.body;
    const newStatus = await ServiceStatus.create({
      service_status,
      description,
      is_active,
    });
    res.status(201).json(newStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create service status', details: error.message });
  }
};

// Get all Service Status records
export const getAllServiceStatus = async (req, res) => {
  try {
    const statuses = await ServiceStatus.findAll();
    res.status(200).json(statuses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve service statuses', details: error.message });
  }
};

// Get one Service Status by ID
export const getServiceStatusById = async (req, res) => {
  try {
    const { id } = req.params;
    const status = await ServiceStatus.findByPk(id);
    if (!status) {
      return res.status(404).json({ error: 'Service status not found' });
    }
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve service status', details: error.message });
  }
};

// Update Service Status
export const updateServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { service_status, description, is_active } = req.body;

    const status = await ServiceStatus.findByPk(id);
    if (!status) {
      return res.status(404).json({ error: 'Service status not found' });
    }

    await status.update({ service_status, description, is_active });
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update service status', details: error.message });
  }
};

// Delete Service Status
export const deleteServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const status = await ServiceStatus.findByPk(id);
    if (!status) {
      return res.status(404).json({ error: 'Service status not found' });
    }

    await status.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete service status', details: error.message });
  }
};
