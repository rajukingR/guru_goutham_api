import db from '../models/index.js';
const PurchaseQuotation = db.PurchaseQuotation;

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
    const quotations = await PurchaseQuotation.findAll();
    res.status(200).json(quotations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching quotations", error });
  }
};

// Get a purchase quotation by ID
export const getPurchaseQuotationById = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await PurchaseQuotation.findByPk(id);

    if (!quotation) return res.status(404).json({ message: "Purchase quotation not found" });

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
