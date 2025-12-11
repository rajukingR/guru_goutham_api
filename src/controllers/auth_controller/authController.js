// src/controllers/auth_controller/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../../models/index.js';
import nodemailer from 'nodemailer';

const User = db.User;

// === SIGNUP ===
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      full_name: name,
      email,
      password_hash: hashedPassword,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: newUser.id, full_name: newUser.full_name, email: newUser.email },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error signing up', error: error.message });
  }
};

// === SIGNIN ===
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Add important data inside token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role_name: user.role_name,
        superior_id: user.superior_id
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Signin successful",
      token,
      user: { id: user.id,superior_id: user.superior_id, full_name: user.full_name, email: user.email,role_name: user.role_name, image: user.image },
    });

  } catch (error) {
    res.status(500).json({ message: "Error signing in", error: error.message });
  }
};


// === FORGOT PASSWORD ===
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate reset token with 10-minute expiry
    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '10m' } // 🔥 10 minutes expiry
    );

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      text: `Click here to reset your password (valid for 10 minutes): ${resetLink}`,
    });

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error processing request', error: error.message });
  }
};


// === RESET PASSWORD ===
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and password are required' });

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Hash and update password
    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({ password_hash: hashedPassword });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};
