import db from "../models/index.js";

const StockLocation = db.StockLocation;

// Create a new Stock Location
export const createStockLocation = async (req, res) => {
  try {
    const data = await StockLocation.create(req.body);
    res.status(201).json({ message: "Stock location created successfully", data });
  } catch (error) {
    res.status(500).json({ message: "Error creating stock location", error: error.message });
  }
};

// Get all Stock Locations
export const getAllStockLocations = async (req, res) => {
  try {
    const locations = await StockLocation.findAll();
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving stock locations", error: error.message });
  }
};

// Get single Stock Location by ID
export const getStockLocationById = async (req, res) => {
  try {
    const location = await StockLocation.findByPk(req.params.id);
    if (!location) {
      return res.status(404).json({ message: "Stock location not found" });
    }
    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving stock location", error: error.message });
  }
};

// Update Stock Location by ID
export const updateStockLocation = async (req, res) => {
  try {
    const [updated] = await StockLocation.update(req.body, {
      where: { id: req.params.id },
    });

    if (updated) {
      const updatedLocation = await StockLocation.findByPk(req.params.id);
      res.status(200).json({ message: "Stock location updated", data: updatedLocation });
    } else {
      res.status(404).json({ message: "Stock location not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating stock location", error: error.message });
  }
};

// Delete Stock Location by ID
export const deleteStockLocation = async (req, res) => {
  try {
    const deleted = await StockLocation.destroy({
      where: { id: req.params.id },
    });

    if (deleted) {
      res.status(200).json({ message: "Stock location deleted" });
    } else {
      res.status(404).json({ message: "Stock location not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting stock location", error: error.message });
  }
};
