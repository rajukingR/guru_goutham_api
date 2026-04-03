import db from '../models/index.js';
import { Op } from "sequelize";

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

export const getAllCourierCharges = async (req, res) => {
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

          // Courier fields
          { service_number: { [Op.like]: `%${search}%` } },
          { invoice_number: { [Op.like]: `%${search}%` } },

          // 🔥 Customer fields (MOST IMPORTANT)
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

    const { count, rows } = await CourierCharges.findAndCountAll({

      where: whereCondition,

      include: [
        {
          model: Contact,
          as: "customer",
          required: false, // 🔥 MUST BE FALSE
        },
      ],

      order: [["id", "DESC"]],
      limit,
      offset,

      distinct: true,   // 🔥 prevents duplicate count
      subQuery: false,  // 🔥 VERY IMPORTANT when using include
    });

    //-----------------------------------

    res.status(200).json({

      courierCharges: rows,

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
      message: "Error fetching courier charges",
      error: error.message,
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
