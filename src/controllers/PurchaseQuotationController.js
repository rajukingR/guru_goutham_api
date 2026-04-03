import db from '../models/index.js';
import { Op } from "sequelize";

const PurchaseQuotation = db.PurchaseQuotation;
const Supplier = db.Supplier;
const ProductTemplete = db.ProductTemplete;


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

    //---------------------------------
    // PAGINATION PARAMS
    //---------------------------------

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    //---------------------------------
    // SEARCH CONDITION
    //---------------------------------

    const whereCondition = search
      ? {
          [Op.or]: [
            { purchase_quotation_id: { [Op.like]: `%${search}%` } },
            { purchase_request_id: { [Op.like]: `%${search}%` } },
            { po_quotation_status: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    //---------------------------------

    const { count, rows } = await PurchaseQuotation.findAndCountAll({
      where: whereCondition,

      include: [
        {
          model: Supplier,
          as: "supplier",
          attributes: ["id", "supplier_name"],
        },
      ],

      order: [["id", "DESC"]],
      limit,
      offset,

      distinct: true, // ⭐ Prevent duplicate counts when using include
    });

    //---------------------------------

    res.status(200).json({
      data: rows,
      totalRecords: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });

  } catch (error) {

    console.error("Error fetching quotations:", error);

    res.status(500).json({
      message: "Error fetching quotations",
      error: error.message,
    });
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
      order: [['id', 'DESC']],
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

    // 1️⃣ Get quotation + supplier
    const quotation = await PurchaseQuotation.findByPk(id, {
      include: [
        {
          model: Supplier,
          as: 'supplier',
        },
      ],
    });

    if (!quotation) {
      return res.status(404).json({
        message: 'Purchase quotation not found',
      });
    }

    // 2️⃣ Get selected_products JSON
    const selectedProducts = quotation.selected_products || [];

    // 3️⃣ Extract product_ids
    const productIds = selectedProducts.map(p => p.product_id);

    // 4️⃣ Fetch ProductTemplete records
    const products = await ProductTemplete.findAll({
      where: {
        id: productIds,
      },
    });

    // 5️⃣ Convert products to map for fast lookup
    const productMap = {};
    products.forEach(product => {
      productMap[product.id] = product;
    });

    // 6️⃣ Attach product details into selected_products
    const enrichedProducts = selectedProducts.map(item => ({
      ...item,
      product: productMap[item.product_id] || null,
    }));

    // 7️⃣ Replace JSON field
    quotation.setDataValue('selected_products', enrichedProducts);

    return res.status(200).json(quotation);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error fetching quotation',
      error: error.message,
    });
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
