import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../../models/index.js';

const User = db.User;

export const signup = async (req, res) => {
  try {
    const { name, email, password, tenant_id, role_id } = req.body;

    if (!name || !email || !password || !tenant_id) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password_hash: hashedPassword,
      tenant_id,
      role_id: role_id || null,
    });

    res.status(201).json({ message: 'User registered successfully', user: { id: newUser.id, email: newUser.email } });

  } catch (error) {
    res.status(500).json({ message: 'Error signing up', error: error.message });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({ message: 'Signin successful', token, user: { id: user.id, email: user.email,} });

  } catch (error) {
    res.status(500).json({ message: 'Error signing in', error: error.message });
  }
};
