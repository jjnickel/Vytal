const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');

const router = express.Router();

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

function getEmailTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// POST /auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const { name, email, password } = req.body;
      const existing = await User.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const newUser = await User.create({ name, email, passwordHash });
      const token = signToken(newUser);

      res.status(201).json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const { email, password } = req.body;
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = signToken(user);
      res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    // Always return 200 to avoid user enumeration
    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });

    try {
      const user = await User.findByEmail(req.body.email);
      if (!user) return;

      const plainToken = await PasswordResetToken.create(user.id);
      const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password/${plainToken}`;

      const transporter = getEmailTransporter();
      if (transporter) {
        await transporter.sendMail({
          from: `"Vytal" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: 'Reset your Vytal password',
          html: `
            <h2>Password Reset</h2>
            <p>Hi ${user.name},</p>
            <p>You requested a password reset. Click the link below to set a new password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="background:#6366F1;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">Reset Password</a>
            <p>If you didn't request this, ignore this email.</p>
          `,
        });
      } else {
        // Dev fallback — log the token
        console.log(`[DEV] Password reset token for ${user.email}: ${plainToken}`);
        console.log(`[DEV] Reset URL: ${resetUrl}`);
      }
    } catch (err) {
      console.error('Forgot password error:', err);
    }
  }
);

// POST /auth/reset-password/:token
router.post(
  '/reset-password/:token',
  [
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const record = await PasswordResetToken.findValid(req.params.token);
      if (!record) {
        return res.status(400).json({ error: 'Reset link is invalid or has expired.' });
      }

      const passwordHash = await bcrypt.hash(req.body.password, 12);
      await User.updatePassword(record.user_id, passwordHash);
      await PasswordResetToken.deleteForUser(record.user_id);

      res.json({ message: 'Password updated successfully. You can now log in.' });
    } catch (err) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;
