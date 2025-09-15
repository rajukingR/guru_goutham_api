import db from '../models/index.js';

const CourierCharges = db.CourierCharges;
const Contact = db.Contact;

// ✅ Create Courier Charges
export const createCourierCharges = async (req, res) => {
  try {
    const { body } = req;

    const courierCharges = await CourierCharges.create(body);

    res.status(201).json({
      message: 'Courier charges created successfully',
      courierCharges,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error creating courier charges',
      error,
    });
  }
};

// ✅ Get All Courier Charges with Customer Details
export const getAllCourierCharges = async (req, res) => {
  try {
    const courierCharges = await CourierCharges.findAll({
      order: [['id', 'DESC']],
      include: [
        {
          model: Contact,
          as: 'customer',
          attributes: { exclude: [] },
        },
      ],
    });

    res.status(200).json(courierCharges);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching courier charges',
      error,
    });
  }
};

// ✅ Get Courier Charges by ID with Customer Details
export const getCourierChargesById = async (req, res) => {
  try {
    const courierCharges = await CourierCharges.findByPk(req.params.id, {
      include: [
        {
          model: Contact,
          as: 'customer',
          attributes: { exclude: [] },
        },
      ],
    });

    if (!courierCharges) {
      return res.status(404).json({ message: 'Courier charges not found' });
    }

    res.status(200).json(courierCharges);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching courier charges',
      error,
    });
  }
};


// ✅ Update Courier Charges
export const updateCourierCharges = async (req, res) => {
  try {
    const courierCharges = await CourierCharges.findByPk(req.params.id);

    if (!courierCharges) {
      return res.status(404).json({ message: 'Courier charges not found' });
    }

    await courierCharges.update(req.body);

    res.status(200).json({
      message: 'Courier charges updated successfully',
      courierCharges,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error updating courier charges',
      error,
    });
  }
};

// ✅ Delete Courier Charges
export const deleteCourierCharges = async (req, res) => {
  try {
    const courierCharges = await CourierCharges.findByPk(req.params.id);

    if (!courierCharges) {
      return res.status(404).json({ message: 'Courier charges not found' });
    }

    await courierCharges.destroy();

    res.status(200).json({ message: 'Courier charges deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error deleting courier charges',
      error,
    });
  }
};
