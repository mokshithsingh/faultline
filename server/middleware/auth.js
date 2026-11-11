const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

/**
 * Middleware to require authentication via JWT stored in an httpOnly cookie.
 * Attaches req.user = { id: decoded.userId } upon successful verification.
 */
function requireAuth(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Unauthorized: Invalid authentication token.' });
    }

    req.user = { id: decoded.userId };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired authentication token.' });
  }
}

/**
 * Middleware to authenticate ingestion requests by project API key.
 * Hashes the incoming x-api-key header with SHA-256 and looks up the project by api_key_hash.
 * Attaches req.projectId to the request. Never logs raw keys.
 */
async function validateProjectApiKey(req, res, next) {
  const clientApiKey = req.headers['x-api-key'];

  if (!clientApiKey || typeof clientApiKey !== 'string' || clientApiKey.trim() === '') {
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid x-api-key header.',
    });
  }

  try {
    const keyHash = crypto.createHash('sha256').update(clientApiKey.trim()).digest('hex');
    const result = await pool.query('SELECT id FROM projects WHERE api_key_hash = $1', [keyHash]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid API key.',
      });
    }

    req.projectId = result.rows[0].id;
    return next();
  } catch (error) {
    console.error('Error validating project API key:', error);
    return res.status(500).json({ error: 'Internal server error validating API key.' });
  }
}

module.exports = {
  requireAuth,
  validateProjectApiKey,
};
