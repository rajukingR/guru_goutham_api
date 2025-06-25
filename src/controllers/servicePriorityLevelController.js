import ServicePriorityLevel from '../models/index.js'; // Assumes model is imported via index
const { ServicePriorityLevel: SPL } = ServicePriorityLevel; // Destructure model if using aggregated exports

// Create new entry
export const createServicePriorityLevel = async (req, res) => {
  try {
    const { priority_level, description, is_active } = req.body;
    const newPriority = await SPL.create({ priority_level, description, is_active });
    res.status(201).json(newPriority);
  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({ message: 'Failed to create service priority level.' });
  }
};

// Get all entries
export const getAllServicePriorityLevels = async (req, res) => {
  try {
    const data = await SPL.findAll();
    res.json(data);
  } catch (error) {
    console.error('Fetch all error:', error);
    res.status(500).json({ message: 'Failed to fetch service priority levels.' });
  }
};

// Get one by ID
export const getServicePriorityLevelById = async (req, res) => {
  try {
    const { id } = req.params;
    const priority = await SPL.findByPk(id);
    if (!priority) {
      return res.status(404).json({ message: 'Not found' });
    }
    res.json(priority);
  } catch (error) {
    console.error('Fetch by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch data.' });
  }
};

// Update
export const updateServicePriorityLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority_level, description, is_active } = req.body;
    const priority = await SPL.findByPk(id);
    if (!priority) {
      return res.status(404).json({ message: 'Not found' });
    }
    await priority.update({ priority_level, description, is_active });
    res.json(priority);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Failed to update.' });
  }
};

// Delete
export const deleteServicePriorityLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const priority = await SPL.findByPk(id);
    if (!priority) {
      return res.status(404).json({ message: 'Not found' });
    }
    await priority.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Failed to delete.' });
  }
};
