import db from '../models/index.js';

const RamSpec = db.RamSpec;

// ✅ Create a new RAM spec
export const createRamSpec = async (req, res) => {
  try {
    const data = req.body;

    const newRecord = await RamSpec.create(data);

    res.status(201).json({
      success: true,
      message: 'RAM spec created successfully',
      data: newRecord,
    });
  } catch (error) {
    console.error('Error creating RAM spec:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create RAM spec',
      error: error.message,
    });
  }
};

// ✅ Get all RAM specs
export const getAllRamSpecs = async (req, res) => {
  try {
    const records = await RamSpec.findAll({
      order: [['updated_at', 'DESC']],
    });

    res.status(200).json({
      success: true,
      message: 'All RAM specs fetched',
      data: records,
    });
  } catch (error) {
    console.error('Error fetching RAM specs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch RAM specs',
      error: error.message,
    });
  }
};

// ✅ Get RAM spec by ID
export const getRamSpecById = async (req, res) => {
  try {
    const id = req.params.id;
    const record = await RamSpec.findByPk(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'RAM spec not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'RAM spec fetched successfully',
      data: record,
    });
  } catch (error) {
    console.error('Error fetching RAM spec by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch RAM spec',
      error: error.message,
    });
  }
};

// ✅ Update RAM spec by ID
export const updateRamSpec = async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;

    const [affectedRows] = await RamSpec.update(updates, {
      where: { id },
    });

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'RAM spec not found or no changes made',
      });
    }

    const updatedRecord = await RamSpec.findByPk(id);

    res.status(200).json({
      success: true,
      message: 'RAM spec updated successfully',
      data: updatedRecord,
    });
  } catch (error) {
    console.error('Error updating RAM spec:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update RAM spec',
      error: error.message,
    });
  }
};

// ✅ Delete RAM spec by ID
export const deleteRamSpec = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await RamSpec.destroy({
      where: { id },
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'RAM spec not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'RAM spec deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting RAM spec:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete RAM spec',
      error: error.message,
    });
  }
};
