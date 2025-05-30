import db from '../models/index.js';
const { GRN, GRNItem } = db;

// Create GRN
export const createGRN = async (req, res) => {
  try {
    const {
      grn_number,
      grn_title,
      customer_id,
      customer_name,
      email,
      phone_number,
      grn_date,
      gst_number,
      pan_number,
      grn_created_by,
      industry,
      company_name,
      country,
      state,
      city,
      street,
      landmark,
      pincode,
      informed_person_name,
      informed_person_phone,
      returner_name,
      returner_phone,
      receiver_name,
      receiver_phone,
      description,
      vehicle_number,
      invoice_number,
      items
    } = req.body;

    const grn = await GRN.create({
      grn_number,
      grn_title,
      customer_id,
      customer_name,
      email,
      phone_number,
      grn_date,
      gst_number,
      pan_number,
      grn_created_by,
      industry,
      company_name,
      country,
      state,
      city,
      street,
      landmark,
      pincode,
      informed_person_name,
      informed_person_phone,
      returner_name,
      returner_phone,
      receiver_name,
      receiver_phone,
      description,
      vehicle_number,
      invoice_number
    });

    if (items && Array.isArray(items)) {
      const formattedItems = items.map(item => ({ ...item, grn_id: grn.grn_id }));
      await GRNItem.bulkCreate(formattedItems);
    }

    res.status(201).json({ message: 'GRN created successfully', grn });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating GRN', error });
  }
};

// Get All GRNs
export const getAllGRNs = async (req, res) => {
  try {
    const grns = await GRN.findAll({
      include: [GRNItem]
    });
    res.status(200).json(grns);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching GRNs', error });
  }
};

// Get GRN by ID
export const getGRNById = async (req, res) => {
  try {
    const { id } = req.params;
    const grn = await GRN.findByPk(id, {
      include: [GRNItem]
    });

    if (!grn) return res.status(404).json({ message: 'GRN not found' });

    res.status(200).json(grn);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching GRN', error });
  }
};

// Update GRN
export const updateGRN = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      grn_number,
      grn_title,
      customer_id,
      customer_name,
      email,
      phone_number,
      grn_date,
      gst_number,
      pan_number,
      grn_created_by,
      industry,
      company_name,
      country,
      state,
      city,
      street,
      landmark,
      pincode,
      informed_person_name,
      informed_person_phone,
      returner_name,
      returner_phone,
      receiver_name,
      receiver_phone,
      description,
      vehicle_number,
      invoice_number,
      items
    } = req.body;

    const grn = await GRN.findByPk(id);
    if (!grn) return res.status(404).json({ message: 'GRN not found' });

    await grn.update({
      grn_number,
      grn_title,
      customer_id,
      customer_name,
      email,
      phone_number,
      grn_date,
      gst_number,
      pan_number,
      grn_created_by,
      industry,
      company_name,
      country,
      state,
      city,
      street,
      landmark,
      pincode,
      informed_person_name,
      informed_person_phone,
      returner_name,
      returner_phone,
      receiver_name,
      receiver_phone,
      description,
      vehicle_number,
      invoice_number,
      updated_at: new Date()
    });

    // Update GRN Items
    if (items && Array.isArray(items)) {
      await GRNItem.destroy({ where: { grn_id: id } });
      const formattedItems = items.map(item => ({ ...item, grn_id: id }));
      await GRNItem.bulkCreate(formattedItems);
    }

    res.status(200).json({ message: 'GRN updated successfully', grn });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating GRN', error });
  }
};

// Delete GRN
export const deleteGRN = async (req, res) => {
  try {
    const { id } = req.params;
    const grn = await GRN.findByPk(id);
    if (!grn) return res.status(404).json({ message: 'GRN not found' });

    await GRNItem.destroy({ where: { grn_id: id } });
    await grn.destroy();

    res.status(200).json({ message: 'GRN and related items deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting GRN', error });
  }
};
