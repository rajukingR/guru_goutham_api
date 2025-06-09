// src/controllers/branchController.js
import db from "../models/index.js";
const Branch = db.Branch;

export const createBranch = async (req, res) => {
  try {
    const branch = await Branch.create(req.body);
    res.status(201).json(branch);
  } catch (err) {
    res.status(500).json({ error: "Failed to create branch", details: err });
  }
};

export const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll();
    res.status(200).json(branches);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch branches", details: err });
  }
};

export const getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (branch) {
      res.status(200).json(branch);
    } else {
      res.status(404).json({ error: "Branch not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch branch", details: err });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const [updated] = await Branch.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedBranch = await Branch.findByPk(req.params.id);
      res.status(200).json(updatedBranch);
    } else {
      res.status(404).json({ error: "Branch not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to update branch", details: err });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const deleted = await Branch.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      res.status(200).json({ message: "Branch deleted successfully" });
    } else {
      res.status(404).json({ error: "Branch not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to delete branch", details: err });
  }
};
