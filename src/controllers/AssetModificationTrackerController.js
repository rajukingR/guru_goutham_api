// controllers/AssetModificationTrackerController.js
import db from '../models/index.js';

const Asset = db.AssetModificationTracker;

// Create new record
export const createAssetModification = async (req, res) => {
  try {
    const data = await Asset.create(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all records
export const getAllAssetModifications = async (req, res) => {
  try {
    const data = await Asset.findAll();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single record by ID
export const getAssetModificationById = async (req, res) => {
  try {
    const data = await Asset.findByPk(req.params.id);
    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ error: 'Record not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update record by ID
export const updateAssetModification = async (req, res) => {
  try {
    const [updated] = await Asset.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated === 1) {
      res.status(200).json({ message: 'Updated successfully' });
    } else {
      res.status(404).json({ error: 'Record not found or no change detected' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete record by ID
export const deleteAssetModification = async (req, res) => {
  try {
    const rowsDeleted = await Asset.destroy({
      where: { id: req.params.id }
    });
    if (rowsDeleted === 1) {
      res.status(200).json({ message: 'Deleted successfully' });
    } else {
      res.status(404).json({ error: 'Record not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
