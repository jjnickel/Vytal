const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Helper to sign JWT
function signToken(user) {
  const payload = { sub: user.id, email: user.email };
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: '7d',
  });
}

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    console.log('Register endpoint hit:', req.body);
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      console.log('Missing fields in register request');
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      console.log('User already exists:', email);
      return res.status(409).json({ error: 'User already exists with this email.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, passwordHash });
    console.log('User registered successfully:', email);

    const token = signToken(newUser);
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    console.log('Login endpoint hit:', req.body);
    const { email, password } = req.body || {};

    if (!email || !password) {
      console.log('Missing fields in login request');
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    console.log('Login successful for:', email);
    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
