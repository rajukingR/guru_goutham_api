// controllers/TaxListController.js

import db from '../models/index.js'; // Adjust path as needed
const TaxList = db.TaxList;

// CREATE Tax
export const createTax = async (req, res) => {
  try {
    const { tax_code, tax_name, percentage, is_active } = req.body;

    if (!tax_code || !tax_name || percentage === undefined) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const newTax = await TaxList.create({
      tax_code,
      tax_name,
      percentage,
      is_active: is_active ?? true
    });

    res.status(201).json({ message: 'Tax created successfully', data: newTax });
  } catch (error) {
    res.status(500).json({ message: 'Error creating tax', error });
  }
};

// GET All Taxes
export const getAllTaxes = async (req, res) => {
  try {
    const taxes = await TaxList.findAll();
    res.status(200).json(taxes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tax list', error });
  }
};

// GET Tax by ID
export const getTaxById = async (req, res) => {
  try {
    const tax = await TaxList.findByPk(req.params.id);
    if (!tax) return res.status(404).json({ message: 'Tax not found' });
    res.status(200).json(tax);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tax', error });
  }
};

// UPDATE Tax
export const updateTax = async (req, res) => {
  try {
    const { tax_code, tax_name, percentage, is_active } = req.body;
    const tax = await TaxList.findByPk(req.params.id);

    if (!tax) return res.status(404).json({ message: 'Tax not found' });

    await tax.update({
      tax_code,
      tax_name,
      percentage,
      is_active
    });

    res.status(200).json({ message: 'Tax updated successfully', data: tax });
  } catch (error) {
    res.status(500).json({ message: 'Error updating tax', error });
  }
};

// DELETE Tax
export const deleteTax = async (req, res) => {
  try {
    const tax = await TaxList.findByPk(req.params.id);
    if (!tax) return res.status(404).json({ message: 'Tax not found' });

    await tax.destroy();
    res.status(200).json({ message: 'Tax deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting tax', error });
  }
};
