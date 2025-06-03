import db from "../models/index.js";
const Brand = db.Brand;

// Create
export const createBrand = async (req, res) => {
  try {
    const { brand_number, brand_name, brand_description, active_status = true } = req.body;

    const newBrand = await Brand.create({
      brand_number,
      brand_name,
      brand_description,
      active_status
    });

    res.status(201).json({ message: "Brand created successfully", brand: newBrand });
  } catch (error) {
    console.error("Error creating brand:", error);
    res.status(500).json({ message: "Error creating brand", error });
  }
};

// Read all
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.findAll();
    res.status(200).json(brands);
  } catch (error) {
    console.error("Error fetching brands:", error);
    res.status(500).json({ message: "Error fetching brands", error });
  }
};

// Read active
export const getActiveBrands = async (req, res) => {
  try {
    const brands = await Brand.findAll({ where: { active_status: true } });
    res.status(200).json(brands);
  } catch (error) {
    console.error("Error fetching active brands:", error);
    res.status(500).json({ message: "Error fetching active brands", error });
  }
};

// Get by ID
export const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    res.status(200).json(brand);
  } catch (error) {
    console.error("Error fetching brand:", error);
    res.status(500).json({ message: "Error fetching brand", error });
  }
};

// Update
export const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    const { brand_number, brand_name, brand_description, active_status } = req.body;

    await brand.update({ brand_number, brand_name, brand_description, active_status });

    res.status(200).json({ message: "Brand updated successfully", brand });
  } catch (error) {
    console.error("Error updating brand:", error);
    res.status(500).json({ message: "Error updating brand", error });
  }
};

// Delete
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    await brand.destroy();
    res.status(200).json({ message: "Brand deleted successfully" });
  } catch (error) {
    console.error("Error deleting brand:", error);
    res.status(500).json({ message: "Error deleting brand", error });
  }
};
