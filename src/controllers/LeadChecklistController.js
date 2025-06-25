import db from "../models/index.js";

const LeadChecklist = db.LeadChecklist;

// Create a new Lead Checklist
export const createLeadChecklist = async (req, res) => {
  try {
    const { checklist_name, description, checklist_qty, is_active } = req.body;
    
    if (!checklist_name || !description || checklist_qty === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const data = await LeadChecklist.create({
      checklist_name,
      description,
      checklist_qty,
      is_active: is_active !== undefined ? is_active : true
    });
    
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ 
      message: "Error creating Lead Checklist", 
      error: error.message 
    });
  }
};

// Get all Lead Checklists
export const getAllLeadChecklists = async (req, res) => {
  try {
    const data = await LeadChecklist.findAll({
      order: [['created_at', 'DESC']]
    });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching Lead Checklists", 
      error: error.message 
    });
  }
};

// Get Lead Checklist by ID
export const getLeadChecklistById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const data = await LeadChecklist.findByPk(id);
    if (!data) {
      return res.status(404).json({ message: "Lead Checklist not found" });
    }
    
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching Lead Checklist", 
      error: error.message 
    });
  }
};

// Update Lead Checklist by ID
export const updateLeadChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { checklist_name, description, checklist_qty, is_active } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const [updated] = await LeadChecklist.update({
      checklist_name,
      description,
      checklist_qty,
      is_active
    }, { 
      where: { id } 
    });

    if (!updated) {
      return res.status(404).json({ 
        message: "Lead Checklist not found or no changes" 
      });
    }

    const updatedChecklist = await LeadChecklist.findByPk(id);
    res.status(200).json(updatedChecklist);
  } catch (error) {
    res.status(500).json({ 
      message: "Error updating Lead Checklist", 
      error: error.message 
    });
  }
};

// Delete Lead Checklist by ID
export const deleteLeadChecklist = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const deleted = await LeadChecklist.destroy({ 
      where: { id } 
    });

    if (!deleted) {
      return res.status(404).json({ message: "Lead Checklist not found" });
    }

    res.status(200).json({ 
      message: "Lead Checklist deleted successfully" 
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error deleting Lead Checklist", 
      error: error.message 
    });
  }
};

export default {
  createLeadChecklist,
  getAllLeadChecklists,
  getLeadChecklistById,
  updateLeadChecklist,
  deleteLeadChecklist
};