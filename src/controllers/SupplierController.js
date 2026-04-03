import db from '../models/index.js';
import { Op } from "sequelize";

const Supplier = db.Supplier;

/**
 * CREATE SUPPLIER
 */
export const createSupplier = async (req, res) => {
  try {
    const {
      supplier_code,
      supplier_name,
      supplier_owner,
      gst_number,
      introduced_by,
      description,
      address,
      bank,
      contacts
    } = req.body;

    const supplier = await Supplier.create({
      supplier_code,
      supplier_name,
      supplier_owner,
      gst_number,
      introduced_by,
      description,
      address,   // ✅ JSON
      bank,      // ✅ JSON
      contacts   // ✅ JSON
    });

    res.status(201).json({
      message: 'Supplier created successfully',
      supplier
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error creating supplier',
      error
    });
  }
};

/**
 * GET ALL SUPPLIERS
 */
export const getAllSuppliers = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    //----------------------------------------

    const whereCondition = search
      ? {
          [Op.or]: [
            { supplier_name: { [Op.like]: `%${search}%` } },
            { supplier_code: { [Op.like]: `%${search}%` } },
            { gst_number: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    //----------------------------------------

    const { count, rows } = await Supplier.findAndCountAll({
      where: whereCondition,
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    //----------------------------------------

    res.status(200).json({
      data: rows,
      totalRecords: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error fetching suppliers",
      error: error.message,
    });
  }
};



export const getAllSuppliers1 = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({
      order: [['id', 'DESC']]
    });

    res.status(200).json(suppliers);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching suppliers',
      error
    });
  }
};

/**
 * GET SUPPLIER BY ID
 */
export const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findByPk(id);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.status(200).json(supplier);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching supplier',
      error
    });
  }
};

/**
 * UPDATE SUPPLIER
 */
export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const {
      supplier_code,
      supplier_name,
      supplier_owner,
      gst_number,
      introduced_by,
      description,
      address,
      bank,
      contacts
    } = req.body;

    await supplier.update({
      supplier_code,
      supplier_name,
      supplier_owner,
      gst_number,
      introduced_by,
      description,
      address,   // ✅ JSON replaced
      bank,      // ✅ JSON replaced
      contacts   // ✅ JSON replaced
    });

    res.status(200).json({
      message: 'Supplier updated successfully',
      supplier
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error updating supplier',
      error
    });
  }
};

/**
 * DELETE SUPPLIER
 */
export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    await supplier.destroy();

    res.status(200).json({
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error deleting supplier',
      error
    });
  }
};
