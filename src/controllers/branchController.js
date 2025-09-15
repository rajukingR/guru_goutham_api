import db from "../models/index.js";
const { sequelize } = db;

const Branch = db.BranchesModels; // ✅ Model

// ==================== CREATE ====================
export const createBranch = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      branch_code,
      branch_name,
      pincode,
      country,
      state,
      city,
      address,
      is_active,
    } = req.body;

    // 🔍 Basic validation
    if (!branch_code || !branch_name || !pincode) {
      return res.status(400).json({
        message: "branch_code, branch_name, and pincode are required",
      });
    }

    // 🔍 Check duplicate branch_code
    const existing = await Branch.findOne({
      where: { branch_code },
    });
    if (existing) {
      return res.status(400).json({
        message: `Branch with code '${branch_code}' already exists`,
      });
    }

    const branch = await Branch.create(
      {
        branch_code,
        branch_name,
        pincode,
        country,
        state,
        city,
        address,
        is_active: is_active ?? true,
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json({
      message: "Branch created successfully",
      branch,
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({
      message: "Error creating branch",
      error: error.message,
    });
  }
};

// ==================== READ ALL ====================
export const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll({
      order: [["id", "ASC"]],
    });
    return res.status(200).json(branches);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching branches",
      error: error.message,
    });
  }
};

// ==================== READ ONE ====================
export const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findByPk(id);

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    return res.status(200).json(branch);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching branch",
      error: error.message,
    });
  }
};

// ==================== UPDATE ====================
export const updateBranch = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      branch_code,
      branch_name,
      pincode,
      country,
      state,
      city,
      address,
      is_active,
    } = req.body;

    const branch = await Branch.findByPk(id);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    await branch.update(
      {
        branch_code,
        branch_name,
        pincode,
        country,
        state,
        city,
        address,
        is_active,
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(200).json({
      message: "Branch updated successfully",
      branch,
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({
      message: "Error updating branch",
      error: error.message,
    });
  }
};

// ==================== DELETE ====================
export const deleteBranch = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const branch = await Branch.findByPk(id);

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    await branch.destroy({ transaction: t });
    await t.commit();

    return res.status(200).json({
      message: "Branch deleted successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({
      message: "Error deleting branch",
      error: error.message,
    });
  }
};
