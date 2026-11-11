const express = require('express');
const { validateProjectApiKey } = require('../middleware/auth');
const { ingestEvent } = require('../controllers/ingest');

const router = express.Router();

// POST /v1/ingest -> Authenticates project by hashed API key, then ingests event
router.post('/', validateProjectApiKey, ingestEvent);

module.exports = router;
