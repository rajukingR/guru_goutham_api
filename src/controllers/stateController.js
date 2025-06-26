import db from '../models/index.js';
const State = db.State;

// Create a new state
export const createState = async (req, res) => {
  try {
    const { state_name, country, is_active } = req.body;
    const newState = await State.create({
      state_name,
      country: country || 'India',
      is_active: is_active ?? true,
    });
    res.status(201).json(newState);
  } catch (error) {
    res.status(500).json({ message: 'Error creating state', error: error.message });
  }
};

// Get all states
export const getAllStates = async (req, res) => {
  try {
    const states = await State.findAll();
    res.status(200).json(states);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching states', error: error.message });
  }
};

// Get single state by ID
export const getStateById = async (req, res) => {
  try {
    const { id } = req.params;
    const state = await State.findByPk(id);
    if (!state) {
      return res.status(404).json({ message: 'State not found' });
    }
    res.status(200).json(state);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching state', error: error.message });
  }
};

// Update state by ID
export const updateState = async (req, res) => {
  try {
    const { id } = req.params;
    const { state_name, country, is_active } = req.body;

    const state = await State.findByPk(id);
    if (!state) {
      return res.status(404).json({ message: 'State not found' });
    }

    await state.update({
      state_name,
      country,
      is_active,
    });

    res.status(200).json(state);
  } catch (error) {
    res.status(500).json({ message: 'Error updating state', error: error.message });
  }
};

// Delete state by ID
export const deleteState = async (req, res) => {
  try {
    const { id } = req.params;
    const state = await State.findByPk(id);
    if (!state) {
      return res.status(404).json({ message: 'State not found' });
    }
    await state.destroy();
    res.status(200).json({ message: 'State deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting state', error: error.message });
  }
};
