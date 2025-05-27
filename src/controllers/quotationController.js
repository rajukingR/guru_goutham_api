import db from '../models/index.js';
const Quotation = db.Quotation;
const QuotationItem = db.QuotationItem;

// Create a new quotation
export const createQuotation = async (req, res) => {
  try {
    const {
      quotation_id,
      quotation_title,
      lead_id,
      rental_start_date,
      rental_end_date,
      quotation_date,
      rental_duration,
      remarks,
      quotation_generated_by,
      status,
      items // expected to be an array of quotation items
    } = req.body;

    const quotation = await Quotation.create({
      quotation_id,
      quotation_title,
      lead_id,
      rental_start_date,
      rental_end_date,
      quotation_date,
      rental_duration,
      remarks,
      quotation_generated_by,
      status
    });

    if (items && Array.isArray(items)) {
      const itemsWithQuotationId = items.map(item => ({
        ...item,
        quotation_id: quotation.id
      }));
      await QuotationItem.bulkCreate(itemsWithQuotationId);
    }

    res.status(201).json({ message: 'Quotation created successfully', quotation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating quotation', error });
  }
};

// Get all quotations
export const getAllQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.findAll({ include: [QuotationItem] });
    res.status(200).json(quotations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching quotations', error });
  }
};

// Get quotation by ID
export const getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findByPk(id, { include: [QuotationItem] });

    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    res.status(200).json(quotation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching quotation', error });
  }
};

// Update quotation
export const updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      quotation_title,
      rental_start_date,
      rental_end_date,
      quotation_date,
      rental_duration,
      remarks,
      quotation_generated_by,
      status
    } = req.body;

    const quotation = await Quotation.findByPk(id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    await quotation.update({
      quotation_title,
      rental_start_date,
      rental_end_date,
      quotation_date,
      rental_duration,
      remarks,
      quotation_generated_by,
      status,
      updated_at: new Date()
    });

    res.status(200).json({ message: 'Quotation updated successfully', quotation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating quotation', error });
  }
};

// Delete quotation
export const deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findByPk(id);

    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    await QuotationItem.destroy({ where: { quotation_id: id } }); // delete items first
    await quotation.destroy();

    res.status(200).json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting quotation', error });
  }
};
