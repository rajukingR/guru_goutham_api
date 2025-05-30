import db from '../models/index.js';

const TaxType = db.TaxType;

// Create new tax type
export const createTaxType = async (req, res) => {
  try {
    const { tax_type_name, description, percentage } = req.body;

    if (!tax_type_name || !description || percentage == null) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const taxType = await TaxType.create({
      tax_type_name,
      description,
      percentage,
    });

    res.status(201).json({ message: 'Tax Type created successfully', taxType });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating tax type', error });
  }
};

// Get all tax types
export const getAllTaxTypes = async (req, res) => {
  try {
    const taxTypes = await TaxType.findAll();
    res.status(200).json(taxTypes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching tax types', error });
  }
};

// Get tax type by ID
export const getTaxTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const taxType = await TaxType.findByPk(id);

    if (!taxType) {
      return res.status(404).json({ message: 'Tax Type not found' });
    }

    res.status(200).json(taxType);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching tax type', error });
  }
};

// Update tax type
export const updateTaxType = async (req, res) => {
  try {
    const { id } = req.params;
    const taxType = await TaxType.findByPk(id);

    if (!taxType) {
      return res.status(404).json({ message: 'Tax Type not found' });
    }

    await taxType.update({
      ...req.body,
      updated_at: new Date(),
    });

    res.status(200).json({ message: 'Tax Type updated successfully', taxType });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating tax type', error });
  }
};

// Delete tax type
export const deleteTaxType = async (req, res) => {
  try {
    const { id } = req.params;
    const taxType = await TaxType.findByPk(id);

    if (!taxType) {
      return res.status(404).json({ message: 'Tax Type not found' });
    }

    await taxType.destroy();
    res.status(200).json({ message: 'Tax Type deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting tax type', error });
  }
};
