import db from '../models/index.js';

const ProductTemplete = db.ProductTemplete;

// Create a new product
export const createProduct = async (req, res) => {
  try {
    const { body, file } = req;

    if (file) {
      body.product_image = file.filename;
    }

    const product = await ProductTemplete.create(body);

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating product', error });
  }
};

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const products = await ProductTemplete.findAll();
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching products', error });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await ProductTemplete.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching product', error });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { body, file } = req;
    if (file) {
      body.product_image = file.filename;
    }

    const product = await ProductTemplete.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.update(body);
    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating product', error });
  }
};


// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await ProductTemplete.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.destroy();
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting product', error });
  }
};
