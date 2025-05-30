import db from '../models/index.js';

const Contact = db.Contact;

// Create a new contact with JSON address
export const createContact = async (req, res) => {
  try {
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
      address, // JSON address object
      gst,
      pan_no,
      owner,
      remarks,
      contact_generated_by,
      status // NEW FIELD
    } = req.body;

    const contact = await Contact.create({
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
      status // NEW FIELD
    });

    res.status(201).json({ message: 'Contact created successfully', contact });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating contact', error });
  }
};


// Get all contacts
export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.findAll();
    res.status(200).json(contacts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching contacts', error });
  }
};


// Get all clients where status is 'Active' (and optionally is_active = 1)
export const getAllContactsActived = async (req, res) => {
  try {
    const contacts = await Contact.findAll({
      where: {
        status: 'Active',
      }
    });

    res.status(200).json(contacts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching active contacts', error });
  }
};



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
      status // NEW FIELD
    } = req.body;

    const contact = await Contact.findByPk(id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

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
      status, // NEW FIELD
      updated_at: new Date()
    });

    res.status(200).json({ message: 'Contact updated successfully', contact });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating contact', error });
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
