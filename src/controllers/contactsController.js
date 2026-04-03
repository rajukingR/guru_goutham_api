import db from '../models/index.js';
import { Op } from 'sequelize'; // ✅ ADD THIS LINE
const { Sequelize } = db;
const { Contact, User } = db;
const DeliveryChallan = db.DeliveryChallan;


// Create a new contact with JSON address
export const createContact = async (req, res) => {
  try {
    const {
      superior_id,
      first_name,
      last_name,
      email,
      phone_number,
      company_name,
      customer_id,
      date,
      industry,
      payment_type,
      address, // JSON address object
      gst,
      pan_no,
      owner,
      remarks,
      contact_generated_by,
      is_active,
      status // NEW FIELD
    } = req.body;

    const contact = await Contact.create({
      superior_id,
      first_name,
      last_name,
      email,
      phone_number,
      company_name,
      customer_id,
      date,
      industry,
      payment_type,
      address,
      gst,
      pan_no,
      owner,
      remarks,
      contact_generated_by,
      is_active,
      status // NEW FIELD
    });

    res.status(201).json({ message: 'Contact created successfully', contact });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating contact', error });
  }
};


export const getAllContacts = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    const whereCondition = search
      ? {
        [Op.or]: [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone_number: { [Op.like]: `%${search}%` } },
          { company_name: { [Op.like]: `%${search}%` } },
        ],
      }
      : {};

    const { count, rows } = await Contact.findAndCountAll({
      where: whereCondition,
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    res.status(200).json({
      data: rows,
      totalRecords: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching contacts",
      error,
    });
  }
};



// Get all contacts
export const getAllContacts1 = async (req, res) => {
  try {
    const contacts = await Contact.findAll({
      order: [['id', 'DESC']], // 👈 Sort by ID in descending order
    });
    res.status(200).json(contacts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching contacts', error });
  }
};


// export const getAllContacts = async (req, res) => {
//   try {
//     const { role_name, id } = req.user; // taken from JWT

//     let contacts;

//     if (role_name === "Admin") {
//       // ⭐ Admin → get ALL contacts
//       contacts = await Contact.findAll({
//         include: [
//           {
//             model: User,
//             as: "superior",
//             attributes: ["id", "full_name", "email", "role_name"],
//             required: false,
//           },
//         ],
//         order: [["id", "DESC"]],
//       });
//     } else {
//       contacts = await Contact.findAll({
//         where: { superior_id: id },
//         include: [
//           {
//             model: User,
//             as: "superior",
//             attributes: ["id", "full_name", "email", "role_name"],
//             required: false,
//           },
//         ],
//         order: [["id", "DESC"]],
//       });
//     }

//     res.status(200).json(contacts);

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Error fetching contacts",
//       error: error.message,
//     });
//   }
// };



export const getDeliveryChallansContact = async (req, res) => {
  try {

    //-----------------------------------
    // PAGINATION
    //-----------------------------------

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    //-----------------------------------
    // GET DISTINCT CUSTOMER IDS
    //-----------------------------------

    const challanCustomers = await DeliveryChallan.findAll({
      where: {
        dc_status: "Delivered",      // ✔ matches DB
        defualt_dc: false,           // ✔ 0 in DB
        peripheral_update: false,    // ✔ 0 in DB
        [Op.or]: [
          { type: { [Op.ne]: "Buy" } },
          { type: null }             // ✔ include NULL values
        ]
      },
      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('customer_code')), 'customer_code']
      ],
      raw: true
    });

    const customerCodes = challanCustomers
      .map(item => item.customer_code)
      .filter(Boolean);

    if (!customerCodes.length) {
      return res.status(200).json({
        contacts: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalRecords: 0,
          limit
        }
      });
    }

    //-----------------------------------
    // SEARCH CONDITION
    //-----------------------------------

    let whereCondition = {
      id: { [Op.in]: customerCodes }
    };

    if (search) {
      whereCondition = {
        ...whereCondition,
        [Op.or]: [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone_number: { [Op.like]: `%${search}%` } },
          { company_name: { [Op.like]: `%${search}%` } },
        ]
      };
    }

    //-----------------------------------
    // FETCH WITH COUNT
    //-----------------------------------

    const { count, rows } = await Contact.findAndCountAll({

      where: whereCondition,
      limit,
      offset,
      order: [["created_at", "DESC"]],
      distinct: true
    });

    //-----------------------------------

    res.status(200).json({

      contacts: rows,

      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit
      }

    });

  } catch (error) {
    console.error('Error in getDeliveryChallansContact:', error);
    res.status(500).json({
      message: 'Error fetching contacts',
      error: error.message
    });
  }
};




export const getDeliveryChallansContact1 = async (req, res) => {
  try {

    const challanCustomers = await DeliveryChallan.findAll({
      where: {
        dc_status: "Delivered",      // ✔ matches DB
        defualt_dc: false,           // ✔ 0 in DB
        peripheral_update: false,    // ✔ 0 in DB
        [Op.or]: [
          { type: { [Op.ne]: "Buy" } },
          { type: null }             // ✔ include NULL values
        ]
      },
      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('customer_code')), 'customer_code']
      ],
      raw: true
    });

    const customerCodes = challanCustomers
      .map(item => item.customer_code)
      .filter(Boolean);

    if (!customerCodes.length) {
      return res.status(200).json([]);
    }

    const contacts = await Contact.findAll({
      where: {
        id: { [Op.in]: customerCodes }
      }
    });

    res.status(200).json(contacts);

  } catch (error) {
    console.error('Error in getDeliveryChallansContact:', error);
    res.status(500).json({
      message: 'Error fetching contacts',
      error
    });
  }
};


// Get all clients where status is 'Active' (and optionally is_active = 1)
export const getAllContactsActived = async (req, res) => {
  try {
    const contacts = await Contact.findAll({
      where: {
        is_active: 1,
      }
    });

    res.status(200).json(contacts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching active contacts', error });
  }
};





// export const getAllContactsActived = async (req, res) => {
//   try {
//     const { role_name, id } = req.user; // from JWT

//     let contacts;

//     if (role_name === "Admin") {
//       // ⭐ Admin → get all Active contacts
//       contacts = await Contact.findAll({
//         where: { status: "Active" },
//         include: [
//           {
//             model: User,
//             as: "superior",
//             attributes: ["id", "full_name", "email", "role_name"],
//             required: false,
//           },
//         ],
//         order: [["id", "DESC"]],
//       });

//     } else {
//       // ⭐ Non-admin → get only their Active contacts
//       contacts = await Contact.findAll({
//         where: {
//           status: "Active",
//           superior_id: id,    // ⭐ IMPORTANT FILTER
//         },
//         include: [
//           {
//             model: User,
//             as: "superior",
//             attributes: ["id", "full_name", "email", "role_name"],
//             required: false,
//           },
//         ],
//         order: [["id", "DESC"]],
//       });
//     }

//     res.status(200).json(contacts);

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Error fetching active contacts",
//       error: error.message,
//     });
//   }
// };

// Get contact by ID
export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.status(200).json(contact);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching contact', error });
  }
};

// Update contact
export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      first_name,
      last_name,
      email,
      phone_number,
      company_name,
      customer_id,
      date,
      industry,
      payment_type,
      address,
      gst,
      pan_no,
      owner,
      remarks,
      contact_generated_by,
      is_active
    } = req.body;

    const contact = await Contact.findByPk(id);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // ⭐ Auto-set status based on is_active
    let statusValue = contact.status; // default existing

    if (typeof is_active === "boolean") {
      statusValue = is_active ? "Active" : "Inactive";
    }

    // ⭐ Update fields
    await contact.update({
      first_name,
      last_name,
      email,
      phone_number,
      company_name,
      customer_id,
      date,
      industry,
      payment_type,
      address,
      gst,
      pan_no,
      owner,
      remarks,
      contact_generated_by,
      is_active,
      status: statusValue,   // ⭐ Auto-update status
      updated_at: new Date()
    });

    res.status(200).json({
      message: "Contact updated successfully",
      contact,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error updating contact",
      error,
    });
  }
};



// Delete contact
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    await contact.destroy();
    res.status(200).json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting contact', error });
  }
};
