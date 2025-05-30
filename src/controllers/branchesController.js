import db from '../models/index.js';

const Branch = db.Branch;

// Create new branch
export const createBranch = async (req, res) => {
  try {
    const {
      branch_id,
      branch_name,
      address,
      pincode,
      country_id,
      state_id,
      city_id,
      is_active,
    } = req.body;

    // Check if branch_id already exists
    const existingBranch = await Branch.findOne({ where: { branch_id } });
    if (existingBranch) {
      return res.status(400).json({ message: 'Branch ID already exists' });
    }

    const branch = await Branch.create({
      branch_id,
      branch_name,
      address,
      pincode,
      country_id,
      state_id,
      city_id,
      is_active: is_active !== undefined ? is_active : true,
    });

    res.status(201).json({ message: 'Branch created successfully', branch });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating branch', error });
  }
};

// Get all branches
export const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll();
    res.status(200).json(branches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching branches', error });
  }
};

// Get branch by ID
export const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findByPk(id);

    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    res.status(200).json(branch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching branch', error });
  }
};

// Update branch
export const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      branch_id,
      branch_name,
      address,
      pincode,
      country_id,
      state_id,
      city_id,
      is_active,
    } = req.body;

    const branch = await Branch.findByPk(id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    // Check if branch_id is taken by another branch
    if (branch_id && branch_id !== branch.branch_id) {
      const existingBranch = await Branch.findOne({ where: { branch_id } });
      if (existingBranch) {
        return res.status(400).json({ message: 'Branch ID already exists' });
      }
    }

    await branch.update({
      branch_id: branch_id || branch.branch_id,
      branch_name: branch_name || branch.branch_name,
      address: address || branch.address,
      pincode: pincode || branch.pincode,
      country_id: country_id || branch.country_id,
      state_id: state_id || branch.state_id,
      city_id: city_id || branch.city_id,
      is_active: is_active !== undefined ? is_active : branch.is_active,
      updated_at: new Date(),
    });

    res.status(200).json({ message: 'Branch updated successfully', branch });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating branch', error });
  }
};

// Delete branch
export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findByPk(id);

    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    await branch.destroy();

    res.status(200).json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting branch', error });
  }
};
