// server/middleware/auth.js
// Middleware to authenticate incoming ingestion requests via the x-api-key header.

function validateApiKey(req, res, next) {
  const expectedApiKey = process.env.INGEST_API_KEY || process.env.DB_INGEST_API_KEY;

  if (!expectedApiKey) {
    console.error('Error: INGEST_API_KEY is not configured in environment variables.');
    return res.status(500).json({ error: 'Server authentication configuration error.' });
  }

  const clientApiKey = req.headers['x-api-key'];

  if (!clientApiKey || clientApiKey !== expectedApiKey) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid or missing x-api-key header.',
    });
  }

  next();
}

module.exports = {
  validateApiKey,
};
