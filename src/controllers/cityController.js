import db from '../models/index.js'; // Adjust this path to where your models are initialized

const City = db.City; // or whatever your model is named in the db object
// Create a new city
export const createCity = async (req, res) => {
  try {
    const { city_name, country, state, is_active = true } = req.body;

    if (!city_name || !country || !state) {
      return res.status(400).json({ 
        success: false,
        message: 'City name, country, and state are required fields' 
      });
    }

    const newCity = await City.create({
      city_name,
      country,
      state,
      is_active
    });

    return res.status(201).json({
      success: true,
      message: 'City created successfully',
      data: newCity
    });
  } catch (error) {
    console.error('Error creating city:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create city',
      error: error.message
    });
  }
};

// Get all cities
export const getAllCities = async (req, res) => {
  try {
    const cities = await City.findAll();
    
    return res.status(200).json({
      success: true,
      message: 'Cities retrieved successfully',
      data: cities
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: error.message
    });
  }
};

// Get city by ID
export const getCityById = async (req, res) => {
  try {
    const { id } = req.params;
    const city = await City.findByPk(id);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'City retrieved successfully',
      data: city
    });
  } catch (error) {
    console.error('Error fetching city:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch city',
      error: error.message
    });
  }
};

// Update city
export const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { city_name, country, state, is_active } = req.body;

    const city = await City.findByPk(id);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    const updatedCity = await city.update({
      city_name: city_name || city.city_name,
      country: country || city.country,
      state: state || city.state,
      is_active: is_active !== undefined ? is_active : city.is_active
    });

    return res.status(200).json({
      success: true,
      message: 'City updated successfully',
      data: updatedCity
    });
  } catch (error) {
    console.error('Error updating city:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update city',
      error: error.message
    });
  }
};

// Delete city
export const deleteCity = async (req, res) => {
  try {
    const { id } = req.params;
    const city = await City.findByPk(id);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    await city.destroy();
    return res.status(200).json({
      success: true,
      message: 'City deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting city:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete city',
      error: error.message
    });
  }
};

// Get active cities
export const getActiveCities = async (req, res) => {
  try {
    const cities = await City.findAll({
      where: { is_active: true }
    });

    return res.status(200).json({
      success: true,
      message: 'Active cities retrieved successfully',
      data: cities
    });
  } catch (error) {
    console.error('Error fetching active cities:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active cities',
      error: error.message
    });
  }
};