const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// @route   POST /api/admin/login
// @desc    Admin login - returns JWT token
// @access  Public
router.post('/login', async (req, res) => {
  let stage = 'request validation';

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    stage = 'admin lookup';
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    stage = 'password comparison';
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    if (typeof process.env.JWT_SECRET !== 'string' || !process.env.JWT_SECRET.trim()) {
      console.error('Admin login configuration error: JWT_SECRET is missing or empty');
      return res.status(500).json({ message: 'Authentication is not configured on the server' });
    }

    stage = 'token generation';
    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      admin: { username: admin.username },
    });
  } catch (error) {
    console.error('Admin login failed:', {
      stage,
      errorName: error.name || 'UnknownError',
      errorCode: error.code || 'none',
    });
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;
