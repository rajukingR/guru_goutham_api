// AssetController.js
import db from '../models/index.js'; // Adjust path as needed
const Asset = db.Asset;

// Create a new Asset
export const createAsset = async (req, res) => {
  try {
    const asset = await Asset.create(req.body);
    res.status(201).json(asset);
  } catch (error) {
    console.error('Create Asset Error:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  }
};

// Get all Assets
export const getAllAssets = async (req, res) => {
  try {
    const assets = await Asset.findAll();
    res.status(200).json(assets);
  } catch (error) {
    console.error('Get All Assets Error:', error);
    res.status(500).json({ error: 'Failed to retrieve assets' });
  }
};

// Get Asset by ID
export const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.status(200).json(asset);
  } catch (error) {
    console.error('Get Asset Error:', error);
    res.status(500).json({ error: 'Failed to retrieve asset' });
  }
};

// Update Asset
export const updateAsset = async (req, res) => {
  try {
    const [updated] = await Asset.update(req.body, {
      where: { asset_id: req.params.id },
    });

    if (updated === 0) {
      return res.status(404).json({ error: 'Asset not found or no changes made' });
    }

    const updatedAsset = await Asset.findByPk(req.params.id);
    res.status(200).json(updatedAsset);
  } catch (error) {
    console.error('Update Asset Error:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
};

// Delete Asset
export const deleteAsset = async (req, res) => {
  try {
    const deleted = await Asset.destroy({
      where: { asset_id: req.params.id },
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.status(200).json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Delete Asset Error:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
};
