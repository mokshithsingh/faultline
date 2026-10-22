const express = require('express');
const { validateApiKey } = require('../middleware/auth');
const { ingestEvent } = require('../controllers/ingest');

const router = express.Router();

// POST /ingest -> Validates API key in middleware, then handles ingestion in controller
router.post('/', validateApiKey, ingestEvent);

module.exports = router;
