import db from '../models/index.js';

const Role = db.Role;

// Create new role
export const createRole = async (req, res) => {
    try {
        const {
            role_name,
            description,
            is_active
        } = req.body;

        // Optional: Check if role_name already exists
        const existingRole = await Role.findOne({
            where: {
                role_name
            }
        });
        if (existingRole) {
            return res.status(400).json({
                message: 'Role name already exists'
            });
        }

        const role = await Role.create({
            role_name,
            description,
            is_active: is_active !== undefined ? is_active : true,
        });

        res.status(201).json({
            message: 'Role created successfully',
            role
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error creating role',
            error
        });
    }
};

// Get all roles
export const getAllRoles = async (req, res) => {
    try {
        const roles = await Role.findAll();
        res.status(200).json(roles);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error fetching roles',
            error
        });
    }
};

// Get role by ID
export const getRoleById = async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const role = await Role.findByPk(id);

        if (!role) return res.status(404).json({
            message: 'Role not found'
        });

        res.status(200).json(role);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error fetching role',
            error
        });
    }
};

// Update role
export const updateRole = async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const {
            role_name,
            description,
            is_active
        } = req.body;

        const role = await Role.findByPk(id);
        if (!role) return res.status(404).json({
            message: 'Role not found'
        });

        // Optional: Check for duplicate role_name on update
        if (role_name && role_name !== role.role_name) {
            const existingRole = await Role.findOne({
                where: {
                    role_name
                }
            });
            if (existingRole) {
                return res.status(400).json({
                    message: 'Role name already exists'
                });
            }
        }

        await role.update({
            role_name: role_name || role.role_name,
            description: description || role.description,
            is_active: is_active !== undefined ? is_active : role.is_active,
            updated_at: new Date(),
        });

        res.status(200).json({
            message: 'Role updated successfully',
            role
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error updating role',
            error
        });
    }
};

// Delete role
export const deleteRole = async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const role = await Role.findByPk(id);

        if (!role) return res.status(404).json({
            message: 'Role not found'
        });

        await role.destroy();

        res.status(200).json({
            message: 'Role deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error deleting role',
            error
        });
    }
};