import db from '../models/index.js';
const PurchaseQuotation = db.PurchaseQuotation;
const Supplier = db.Supplier;

// Create a new purchase quotation
export const createPurchaseQuotation = async (req, res) => {
  try {
    const {
      purchase_quotation_id,
      purchase_request_id,
      supplier_id,
      purchase_quotation_date,
      purchase_type,
      po_quotation_status,
      owner,
      description,
      selected_products
    } = req.body;

    const newQuotation = await PurchaseQuotation.create({
      purchase_quotation_id,
      purchase_request_id,
      supplier_id,
      purchase_quotation_date,
      purchase_type,
      po_quotation_status,
      owner,
      description,
      selected_products,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({ message: "Purchase quotation created successfully", quotation: newQuotation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating purchase quotation", error });
  }
};

// Get all purchase quotations
export const getAllPurchaseQuotations = async (req, res) => {
  try {
    const quotations = await PurchaseQuotation.findAll({
      include: [
        {
          model: Supplier,
          as: 'supplier', // Make sure this matches your association alias
          attributes: ['supplier_id', 'supplier_name'], // Include only needed fields
        },
      ],
    });

    res.status(200).json(quotations);
  } catch (error) {
    console.error("Error fetching quotations:", error);
    res.status(500).json({ message: "Error fetching quotations", error });
  }
};


export const getApprovedPurchaseQuotations = async (req, res) => {
  try {
    const quotations = await db.PurchaseQuotation.findAll({
      where: {
        po_quotation_status: 'Approved',
      },
      include: [
        {
          model: db.Supplier,
          as: 'supplier',
          attributes: ['supplier_name'],
        },
      ],
    });

    if (!quotations || quotations.length === 0) {
      return res.status(404).json({ message: 'No approved purchase quotations found' });
    }

    res.status(200).json(quotations);
  } catch (error) {
    console.error('Error fetching approved quotations:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
// Get a purchase quotation by ID
export const getPurchaseQuotationById = async (req, res) => {
  try {
    const { id } = req.params;

    const quotation = await PurchaseQuotation.findByPk(id, {
      include: [
        {
          model: Supplier,
          as: 'supplier', // Must match association alias
          attributes: ['supplier_id', 'supplier_name'],
        },
      ],
    });

    if (!quotation) {
      return res.status(404).json({ message: "Purchase quotation not found" });
    }

    res.status(200).json(quotation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching quotation", error });
  }
};

// Update a purchase quotation
export const updatePurchaseQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      purchase_quotation_id,
      purchase_request_id,
      supplier_id,
      purchase_quotation_date,
      purchase_type,
      po_quotation_status,
      owner,
      description,
      selected_products
    } = req.body;

    const quotation = await PurchaseQuotation.findByPk(id);
    if (!quotation) return res.status(404).json({ message: "Purchase quotation not found" });

    await quotation.update({
      purchase_quotation_id,
      purchase_request_id,
      supplier_id,
      purchase_quotation_date,
      purchase_type,
      po_quotation_status,
      owner,
      description,
      selected_products,
      updated_at: new Date()
    });

    res.status(200).json({ message: "Purchase quotation updated successfully", quotation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating purchase quotation", error });
  }
};

// Delete a purchase quotation
export const deletePurchaseQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await PurchaseQuotation.findByPk(id);

    if (!quotation) return res.status(404).json({ message: "Purchase quotation not found" });

    await quotation.destroy();

    res.status(200).json({ message: "Purchase quotation deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting quotation", error });
  }
};
