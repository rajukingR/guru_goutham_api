import db from '../models/index.js';
const Role = db.Role;

export const createRole = async (req, res) => {
  try {
    const { role_name, description, is_active = true } = req.body;
    const newRole = await Role.create({ 
      role_name, 
      description, 
      is_active 
    });
    res.status(201).json(newRole);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
};

export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    res.status(200).json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.status(200).json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { role_name, description, is_active } = req.body;
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    await role.update({ 
      role_name, 
      description, 
      is_active,
      updated_at: new Date() 
    });
    res.status(200).json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    await role.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
};