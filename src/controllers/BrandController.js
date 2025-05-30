// controllers/BrandController.js

import db from '../models/index.js';
const Brand = db.Brand;

const BrandController = {
  // Create a new brand
  async create(req, res) {
    try {
      const { brand_number, brand_name, brand_description, active_status } = req.body;

      const newBrand = await Brand.create({
        brand_number,
        brand_name,
        brand_description,
        active_status,
      });

      return res.status(201).json(newBrand);
    } catch (error) {
      return res.status(500).json({ message: 'Error creating brand', error });
    }
  },

  // Get all brands
  async findAll(req, res) {
    try {
      const brands = await Brand.findAll();
      return res.status(200).json(brands);
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving brands', error });
    }
  },

  // Get a single brand by ID
  async findOne(req, res) {
    try {
      const { id } = req.params;
      const brand = await Brand.findByPk(id);

      if (!brand) {
        return res.status(404).json({ message: 'Brand not found' });
      }

      return res.status(200).json(brand);
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving brand', error });
    }
  },

  // Update a brand by ID
  async update(req, res) {
    try {
      const { id } = req.params;
      const { brand_number, brand_name, brand_description, active_status } = req.body;

      const [updated] = await Brand.update({
        brand_number,
        brand_name,
        brand_description,
        active_status,
      }, {
        where: { id }
      });

      if (!updated) {
        return res.status(404).json({ message: 'Brand not found' });
      }

      const updatedBrand = await Brand.findByPk(id);
      return res.status(200).json(updatedBrand);
    } catch (error) {
      return res.status(500).json({ message: 'Error updating brand', error });
    }
  },

  // Delete a brand by ID
  async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Brand.destroy({ where: { id } });

      if (!deleted) {
        return res.status(404).json({ message: 'Brand not found' });
      }

      return res.status(200).json({ message: 'Brand deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting brand', error });
    }
  },
};

export default BrandController;
