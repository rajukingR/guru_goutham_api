import db from '../models/index.js';

const AssetModificationTracker = db.AssetModificationTracker;
const AssetId = db.AssetId;

export const createAssetModification = async (req, res) => {
  try {
    const data = req.body;

    // Step 1: Create the asset modification record
    const newRecord = await AssetModificationTracker.create(data);

    // Step 2: Update asset_ids table if new RAM or storage is present
    const { invoice_id, asset_id, new_ram, new_storage, new_ram_cost, new_storage_cost } = data;

    if (invoice_id && asset_id && (new_ram || new_storage)) {
      const updateData = {};
      if (new_ram) updateData.new_ram = new_ram;
      if (new_ram_cost !== undefined) updateData.new_ram_cost = parseFloat(new_ram_cost) || 0;
      if (new_storage) updateData.new_storage = new_storage;
      if (new_storage_cost !== undefined) updateData.new_storage_cost = parseFloat(new_storage_cost) || 0;

      await AssetId.update(updateData, {
        where: {
          invoice_id,
          asset_id,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Asset modification record created successfully',
      data: newRecord,
    });
  } catch (error) {
    console.error('Error creating asset modification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create asset modification record',
      error: error.message,
    });
  }
};



// ✅ Get all asset modification records
export const getAllAssetModifications = async (req, res) => {
  try {
    const records = await AssetModificationTracker.findAll({
      order: [['updated_at', 'DESC']],
    });

    res.status(200).json({
      success: true,
      message: 'All asset modification records fetched',
      data: records,
    });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset modification records',
      error: error.message,
    });
  }
};

// ✅ Get a single record by ID
export const getAssetModificationById = async (req, res) => {
  try {
    const id = req.params.id;
    const record = await AssetModificationTracker.findByPk(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Record fetched successfully',
      data: record,
    });
  } catch (error) {
    console.error('Error fetching record by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset modification record',
      error: error.message,
    });
  }
};

// ✅ Update a record by ID
export const updateAssetModification = async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;

    const [affectedRows] = await AssetModificationTracker.update(updates, {
      where: { id },
    });

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Record not found or no changes made',
      });
    }

    const updatedRecord = await AssetModificationTracker.findByPk(id);

    res.status(200).json({
      success: true,
      message: 'Record updated successfully',
      data: updatedRecord,
    });
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update asset modification record',
      error: error.message,
    });
  }
};

// ✅ Delete a record by ID
export const deleteAssetModification = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await AssetModificationTracker.destroy({
      where: { id },
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Record not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Record deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete asset modification record',
      error: error.message,
    });
  }
};
