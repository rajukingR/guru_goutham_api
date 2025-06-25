// controllers/leadStatusController.js

export const createLeadStatus = async (req, res) => {
  try {
    const { lead_status, description, is_active } = req.body;
    const newStatus = await req.models.LeadStatus.create({
      lead_status,
      description,
      is_active,
    });
    res.status(201).json(newStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lead status', details: error.message });
  }
};

export const getAllLeadStatus = async (req, res) => {
  try {
    const statuses = await req.models.LeadStatus.findAll();
    res.status(200).json(statuses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lead statuses', details: error.message });
  }
};

export const getLeadStatusById = async (req, res) => {
  try {
    const { id } = req.params;
    const status = await req.models.LeadStatus.findByPk(id);
    if (!status) {
      return res.status(404).json({ error: 'Lead status not found' });
    }
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lead status', details: error.message });
  }
};

export const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { lead_status, description, is_active } = req.body;

    const status = await req.models.LeadStatus.findByPk(id);
    if (!status) {
      return res.status(404).json({ error: 'Lead status not found' });
    }

    await status.update({ lead_status, description, is_active });
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead status', details: error.message });
  }
};

export const deleteLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await req.models.LeadStatus.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ error: 'Lead status not found' });
    }
    res.status(200).json({ message: 'Lead status deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete lead status', details: error.message });
  }
};
