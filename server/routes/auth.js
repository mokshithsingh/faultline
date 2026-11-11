const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { register, login, logout, getMe } = require('../controllers/auth');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Rate limiter for register and login: 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

module.exports = router;
