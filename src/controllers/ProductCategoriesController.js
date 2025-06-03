import db from "../models/index.js";

const ProductCategory = db.ProductCategory;

// Create a new Product Category
export const createProductCategory = async (req, res) => {
  try {
    const {
      category_number,
      category_name,
      description,
      is_active = true
    } = req.body;

    const newCategory = await ProductCategory.create({
      category_number,
      category_name,
      description,
      is_active
    });

    res.status(201).json({
      message: "Product category created successfully",
      category: newCategory
    });
  } catch (error) {
    console.error("Error creating product category:", error);
    res.status(500).json({ message: "Error creating product category", error });
  }
};

// Get all Product Categories
export const getAllProductCategories = async (req, res) => {
  try {
    const categories = await ProductCategory.findAll();
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching product categories:", error);
    res.status(500).json({ message: "Error fetching product categories", error });
  }
};

// Get Active Product Categories only
export const getActiveProductCategories = async (req, res) => {
  try {
    const categories = await ProductCategory.findAll({
      where: { is_active: true }
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching active product categories:", error);
    res.status(500).json({ message: "Error fetching active categories", error });
  }
};

// Get Product Category by ID
export const getProductCategoryById = async (req, res) => {
  try {
    const category = await ProductCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Product category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    console.error("Error fetching product category:", error);
    res.status(500).json({ message: "Error fetching category", error });
  }
};

// Update Product Category
export const updateProductCategory = async (req, res) => {
  try {
    const category = await ProductCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Product category not found" });
    }

    const {
      category_number,
      category_name,
      description,
      is_active
    } = req.body;

    await category.update({
      category_number,
      category_name,
      description,
      is_active
    });

    res.status(200).json({
      message: "Product category updated successfully",
      category
    });
  } catch (error) {
    console.error("Error updating product category:", error);
    res.status(500).json({ message: "Error updating category", error });
  }
};

// Delete Product Category
export const deleteProductCategory = async (req, res) => {
  try {
    const category = await ProductCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Product category not found" });
    }

    await category.destroy();
    res.status(200).json({ message: "Product category deleted successfully" });
  } catch (error) {
    console.error("Error deleting product category:", error);
    res.status(500).json({ message: "Error deleting category", error });
  }
};
