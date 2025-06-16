import db from '../models/index.js';

const ProductService = db.ProductService;

// Create a new ProductService
export const createProductService = async (req, res) => {
  try {
    const product = await ProductService.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error('Create ProductService Error:', error);
    res.status(500).json({ error: 'Failed to create product service' });
  }
};

// Get all ProductServices
export const getAllProductServices = async (req, res) => {
  try {
    const products = await ProductService.findAll();
    res.status(200).json(products);
  } catch (error) {
    console.error('Fetch ProductServices Error:', error);
    res.status(500).json({ error: 'Failed to fetch product services' });
  }
};

// Get a ProductService by ID
export const getProductServiceById = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await ProductService.findByPk(id);

    if (!product) {
      return res.status(404).json({ error: 'Product service not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Get ProductService Error:', error);
    res.status(500).json({ error: 'Failed to get product service' });
  }
};

// Update a ProductService
export const updateProductService = async (req, res) => {
  try {
    const id = req.params.id;
    const [updated] = await ProductService.update(req.body, {
      where: { id: id }
    });

    if (updated === 0) {
      return res.status(404).json({ error: 'Product service not found or no changes made' });
    }

    const updatedProduct = await ProductService.findByPk(id);
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('Update ProductService Error:', error);
    res.status(500).json({ error: 'Failed to update product service' });
  }
};

// Delete a ProductService
export const deleteProductService = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await ProductService.destroy({
      where: { id: id }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Product service not found' });
    }

    res.status(200).json({ message: 'Product service deleted successfully' });
  } catch (error) {
    console.error('Delete ProductService Error:', error);
    res.status(500).json({ error: 'Failed to delete product service' });
  }
};
