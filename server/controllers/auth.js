const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_COOKIE_NAME = 'token';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getCookieOptions(req) {
  // Mark secure only if request was served over HTTPS (prevents cookie dropping over raw HTTP/IP access)
  const isHttps = req ? (req.secure || req.headers?.['x-forwarded-proto'] === 'https') : false;
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    maxAge: SEVEN_DAYS_MS,
  };
}

function setAuthCookie(req, res, userId) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie(TOKEN_COOKIE_NAME, token, getCookieOptions(req));
}

/**
 * Register a new user account.
 * Validates email format, password min 10 chars, hashes password with bcryptjs.
 * Handles duplicate emails with 409 Conflict.
 * Sets httpOnly session cookie on success.
 */
async function register(req, res) {
  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: 'Valid email address is required.' });
  }

  if (!password || typeof password !== 'string' || password.length < 10) {
    return res.status(400).json({ error: 'Password must be at least 10 characters long.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const insertQuery = `
      INSERT INTO users (email, password_hash, created_at)
      VALUES ($1, $2, NOW())
      RETURNING id, email, created_at;
    `;
    const result = await pool.query(insertQuery, [normalizedEmail, passwordHash]);
    const user = result.rows[0];

    // Log the user in on success via httpOnly cookie
    setAuthCookie(req, res, user.id);

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    // Unique violation in PostgreSQL
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already registered.' });
    }
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
}

/**
 * Log in an existing user.
 * Returns the exact same generic error for unknown email and wrong password.
 * Sets httpOnly session cookie on success.
 */
async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const userResult = await pool.query(
      'SELECT id, email, password_hash, created_at FROM users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    setAuthCookie(req, res, user.id);

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
}

/**
 * Log out user by clearing the auth cookie.
 */
function logout(req, res) {
  const isHttps = req ? (req.secure || req.headers?.['x-forwarded-proto'] === 'https') : false;
  res.clearCookie(TOKEN_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
  });
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
}

/**
 * Get currently authenticated user details.
 */
async function getMe(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return res.status(500).json({ error: 'Internal server error fetching user.' });
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
};
