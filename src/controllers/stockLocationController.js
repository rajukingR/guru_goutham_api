import db from '../models/index.js';

const StockLocation = db.StockLocation;

const createStockLocation = async (req, res) => {
  try {
    const newLocation = await StockLocation.create(req.body);
    res.status(201).json(newLocation);
  } catch (error) {
    res.status(500).json({ message: 'Error creating stock location', error: error.message });
  }
};

const getAllStockLocations = async (req, res) => {
  try {
    const locations = await StockLocation.findAll();
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stock locations', error: error.message });
  }
};


const getAllActiveStockLocations = async (req, res) => {
  try {
    const activeLocations = await StockLocation.findAll({
      where: { is_active: 1 }
    });
    res.status(200).json(activeLocations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active stock locations', error: error.message });
  }
};


const getStockLocationById = async (req, res) => {
  try {
    const location = await StockLocation.findByPk(req.params.id);
    if (!location) return res.status(404).json({ message: 'Stock location not found' });
    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stock location', error: error.message });
  }
};

const updateStockLocation = async (req, res) => {
  try {
    const [updated] = await StockLocation.update(req.body, {
      where: { id: req.params.id },
    });
    if (!updated) return res.status(404).json({ message: 'Stock location not found or not updated' });
    res.status(200).json({ message: 'Stock location updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating stock location', error: error.message });
  }
};

const deleteStockLocation = async (req, res) => {
  try {
    const deleted = await StockLocation.destroy({
      where: { id: req.params.id },
    });
    if (!deleted) return res.status(404).json({ message: 'Stock location not found' });
    res.status(200).json({ message: 'Stock location deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting stock location', error: error.message });
  }
};

export {
  createStockLocation,
  getAllStockLocations,
  getAllActiveStockLocations,
  getStockLocationById,
  updateStockLocation,
  deleteStockLocation,
};
