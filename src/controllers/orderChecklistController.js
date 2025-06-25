import models from '../models/index.js';
const { OrderChecklist } = models;

export const createOrderChecklist = async (req, res) => {
  try {
    const { checklist_name, description, checklist_qty, is_active } = req.body;
    const checklist = await OrderChecklist.create({ checklist_name, description, checklist_qty, is_active });
    res.status(201).json(checklist);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order checklist', details: error.message });
  }
};

export const getAllOrderChecklists = async (req, res) => {
  try {
    const checklists = await OrderChecklist.findAll();
    res.status(200).json(checklists);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order checklists', details: error.message });
  }
};

export const getOrderChecklistById = async (req, res) => {
  try {
    const { id } = req.params;
    const checklist = await OrderChecklist.findByPk(id);
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    res.status(200).json(checklist);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch checklist', details: error.message });
  }
};

export const updateOrderChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { checklist_name, description, checklist_qty, is_active } = req.body;

    const checklist = await OrderChecklist.findByPk(id);
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    await checklist.update({ checklist_name, description, checklist_qty, is_active });
    res.status(200).json(checklist);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update checklist', details: error.message });
  }
};

export const deleteOrderChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await OrderChecklist.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    res.status(200).json({ message: 'Checklist deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete checklist', details: error.message });
  }
};
