import db from '../models/index.js';
import { Op } from "sequelize";

const Product = db.Product; 

export const createProduct = async (req, res) => {
  try {
    const {
      category_id,
      brand_id,
      name,
      model,
      description,
      gst_percentage,
      hsn_code,
      specifications,
      image_url,
      is_active,
    } = req.body;

    const existingProduct = await Product.findOne({ where: { name, model } });
    if (existingProduct) {
      return res.status(400).json({ message: "Product with this name and model already exists." });
    }

    const product = await Product.create({
      category_id,
      brand_id,
      name,
      model,
      description,
      gst_percentage,
      hsn_code,
      specifications,
      image_url,
      is_active: is_active ?? 1, 
    });

    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating product", error });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching products", error });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching product", error });
  }
};


export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      brand_id,
      name,
      model,
      description,
      gst_percentage,
      hsn_code,
      specifications,
      image_url,
      is_active,
    } = req.body;

    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    await product.update({
      category_id,
      brand_id,
      name,
      model,
      description,
      gst_percentage,
      hsn_code,
      specifications,
      image_url,
      is_active,
      updated_at: new Date(),
    });

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating product", error });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    await product.destroy();

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting product", error });
  }
};
