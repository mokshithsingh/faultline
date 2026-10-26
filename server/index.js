const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const { pool } = require('./db');
const ingestRouter = require('./routes/ingest');
const issuesRouter = require('./routes/issues');

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check database error:', error);
    return res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/ingest', ingestRouter);
app.use('/issues', issuesRouter);

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
