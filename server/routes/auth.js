const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { register, login, logout, getMe } = require('../controllers/auth');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Rate limiters for register and login: 10 attempts per 15 minutes per IP
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts, please try again later.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
});

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

module.exports = router;
