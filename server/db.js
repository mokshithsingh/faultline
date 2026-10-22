const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.DB_URL) {
  console.error('Error: DB_URL is not set in environment variables.');
}

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

// Prevent unhandled errors on idle clients from crashing the server process
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
