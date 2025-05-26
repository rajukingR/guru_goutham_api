import bcrypt from 'bcryptjs';
import db from '../models/index.js';
import { Op } from "sequelize";

const User = db.User; // Assuming you imported it like this in models/index.js

// Create a new user
export const createUser = async (req, res) => {
  try {
    const { full_name, email, password, role_id, role_name } = req.body;

    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists. Please use a different email." });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      full_name,
      email,
      password_hash: hashedPassword,
      role_id,
      role_name,
    });

    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating user", error });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users", error });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching user", error });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, password, role_id, role_name } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if email is already in use by another user
    const existingEmail = await User.findOne({
      where: { email, id: { [Op.ne]: id } }
    });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists. Please use a different email." });
    }

    // Hash the new password if provided
    let updatedPassword = user.password_hash;
    if (password) {
      updatedPassword = await bcrypt.hash(password, 10);
    }

    await user.update({
      full_name,
      email,
      password_hash: updatedPassword,
      role_id,
      role_name,
      updated_at: new Date()
    });

    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating user", error });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) return res.status(404).json({ message: "User not found" });

    await user.destroy();

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting user", error });
  }
};
