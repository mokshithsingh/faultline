const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { pool } = require('./db');
const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const ingestRouter = require('./routes/ingest');

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Enforce JWT_SECRET requirement at startup; crash immediately if missing (no fallback default)
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 4000;

// Trust proxy for express-rate-limit and reverse proxy setups
app.set('trust proxy', 1);

app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));

app.get('/health', (req, res) => {
  return res.status(200).json({ ok: true });
});

// CORS open to any origin ONLY on /v1/ingest; /api routes are same-origin and need no CORS
app.use('/v1/ingest', cors(), ingestRouter);

// Project and auth routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Faultline server is running on port ${PORT}`);
  });
}

module.exports = app;
