import db from '../models/index.js';
const ProductCategory = db.ProductCategory;

export const createCategory = async (req, res) => {
  try {
    const data = await ProductCategory.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const data = await ProductCategory.findAll();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const data = await ProductCategory.findByPk(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const [updated] = await ProductCategory.update(req.body, {
      where: { id: req.params.id }
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, message: 'Category updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const deleted = await ProductCategory.destroy({
      where: { id: req.params.id }
    });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
