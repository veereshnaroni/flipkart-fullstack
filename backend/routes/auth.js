const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const config = require('../config/config');
const { requireAuth } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const existingUser = db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const result = db.run(
      'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), phone || '', hashedPassword, 'customer']
    );

    const newUser = db.get('SELECT id, name, email, phone, role, avatar, created_at FROM users WHERE id = ?', [result.lastInsertRowid]);
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Flipkart.',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/mobile and password.' });
    }

    const input = emailOrPhone.trim().toLowerCase();
    const user = db.get('SELECT * FROM users WHERE LOWER(email) = ? OR phone = ?', [input, input]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar
    };

    const token = generateToken(safeUser);
    res.json({
      success: true,
      message: `Welcome back, ${safeUser.name}!`,
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// POST /api/auth/demo-login
router.post('/demo-login', (req, res) => {
  try {
    const { role } = req.body; // 'admin' or 'customer'
    const targetEmail = role === 'admin' ? 'admin@flipkart.com' : 'user@flipkart.com';

    const user = db.get('SELECT id, name, email, phone, role, avatar FROM users WHERE email = ?', [targetEmail]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Demo account not found. Please run seed script.' });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      message: `Logged in as demo ${user.role}: ${user.name}`,
      token,
      user
    });
  } catch (err) {
    console.error('Demo login error:', err);
    res.status(500).json({ success: false, message: 'Demo login failed.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { name, phone } = req.body;
    db.run('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, req.user.id]);
    const updated = db.get('SELECT id, name, email, phone, role, avatar FROM users WHERE id = ?', [req.user.id]);
    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

module.exports = router;
