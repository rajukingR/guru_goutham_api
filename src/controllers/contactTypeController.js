import db from '../models/index.js';

const ContactType = db.ContactType;

// Create new contact type
export const createContactType = async (req, res) => {
  try {
    const { contact_type_name, description, type } = req.body;

    if (!contact_type_name || !description || !type) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const contactType = await ContactType.create({
      contact_type_name,
      description,
      type,
    });

    res.status(201).json({ message: 'Contact Type created successfully', contactType });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating contact type', error });
  }
};

// Get all contact types
export const getAllContactTypes = async (req, res) => {
  try {
    const contactTypes = await ContactType.findAll();
    res.status(200).json(contactTypes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching contact types', error });
  }
};

// Get contact type by ID
export const getContactTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const contactType = await ContactType.findByPk(id);

    if (!contactType) {
      return res.status(404).json({ message: 'Contact Type not found' });
    }

    res.status(200).json(contactType);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching contact type', error });
  }
};

// Update contact type
export const updateContactType = async (req, res) => {
  try {
    const { id } = req.params;
    const contactType = await ContactType.findByPk(id);

    if (!contactType) {
      return res.status(404).json({ message: 'Contact Type not found' });
    }

    await contactType.update({
      ...req.body,
      updated_at: new Date(),
    });

    res.status(200).json({ message: 'Contact Type updated successfully', contactType });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating contact type', error });
  }
};

// Delete contact type
export const deleteContactType = async (req, res) => {
  try {
    const { id } = req.params;
    const contactType = await ContactType.findByPk(id);

    if (!contactType) {
      return res.status(404).json({ message: 'Contact Type not found' });
    }

    await contactType.destroy();
    res.status(200).json({ message: 'Contact Type deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting contact type', error });
  }
};
