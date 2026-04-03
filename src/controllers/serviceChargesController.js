import db from '../models/index.js';
import {
  Op
} from "sequelize";
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

export const getAllServiceCharges = async (req, res) => {
  try {

    //-----------------------------------
    // PAGINATION
    //-----------------------------------

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    //-----------------------------------
    // GLOBAL SEARCH
    //-----------------------------------

    let whereCondition = {};

    if (search) {

      whereCondition = {
        [Op.or]: [

          // ServiceCharges fields
          { service_number: { [Op.like]: `%${search}%` } },
          { invoice_number: { [Op.like]: `%${search}%` } },

          // 🔥 Customer fields (IMPORTANT)
          { "$customer.first_name$": { [Op.like]: `%${search}%` } },
          { "$customer.last_name$": { [Op.like]: `%${search}%` } },
          { "$customer.phone_number$": { [Op.like]: `%${search}%` } },
          { "$customer.email$": { [Op.like]: `%${search}%` } },
          { "$customer.company_name$": { [Op.like]: `%${search}%` } },

        ],
      };
    }

    //-----------------------------------
    // FETCH
    //-----------------------------------

    const { count, rows } = await ServiceCharges.findAndCountAll({

      where: whereCondition,

      include: [
        {
          model: Contact,
          as: "customer",
          required: false, // 🔥 MUST be false when using $association$
        },
      ],

      order: [["id", "DESC"]],
      limit,
      offset,
      distinct: true,
      subQuery: false, // 🔥 VERY IMPORTANT when searching include
    });

    //-----------------------------------

    res.status(200).json({

      serviceCharges: rows,

      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit
      }

    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching service charges",
      error: error.message,
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
