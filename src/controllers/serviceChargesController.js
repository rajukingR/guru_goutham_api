import db from '../models/index.js';

const ServiceCharges = db.ServiceCharges;
const Contact = db.Contact;

// ✅ Create Service Charges
export const createServiceCharges = async (req, res) => {
  try {
    const { body } = req;

    const serviceCharges = await ServiceCharges.create(body);

    res.status(201).json({
      message: 'Service charges created successfully',
      serviceCharges,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error creating service charges',
      error,
    });
  }
};

// ✅ Get All Service Charges with Customer Details
export const getAllServiceCharges = async (req, res) => {
  try {
    const serviceCharges = await ServiceCharges.findAll({
      order: [['id', 'DESC']],
      include: [
        {
          model: Contact,
          as: 'customer',
          attributes: { exclude: [] },
        },
      ],
    });

    res.status(200).json(serviceCharges);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching service charges',
      error,
    });
  }
};

// ✅ Get Service Charges by ID with Customer Details
export const getServiceChargesById = async (req, res) => {
  try {
    const serviceCharges = await ServiceCharges.findByPk(req.params.id, {
      include: [
        {
          model: Contact,
          as: 'customer',
          attributes: { exclude: [] },
        },
      ],
    });

    if (!serviceCharges) {
      return res.status(404).json({ message: 'Service charges not found' });
    }

    res.status(200).json(serviceCharges);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching service charges',
      error,
    });
  }
};

// ✅ Update Service Charges
export const updateServiceCharges = async (req, res) => {
  try {
    const serviceCharges = await ServiceCharges.findByPk(req.params.id);

    if (!serviceCharges) {
      return res.status(404).json({ message: 'Service charges not found' });
    }

    await serviceCharges.update(req.body);

    res.status(200).json({
      message: 'Service charges updated successfully',
      serviceCharges,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error updating service charges',
      error,
    });
  }
};

// ✅ Delete Service Charges
export const deleteServiceCharges = async (req, res) => {
  try {
    const serviceCharges = await ServiceCharges.findByPk(req.params.id);

    if (!serviceCharges) {
      return res.status(404).json({ message: 'Service charges not found' });
    }

    await serviceCharges.destroy();

    res.status(200).json({ message: 'Service charges deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error deleting service charges',
      error,
    });
  }
};
