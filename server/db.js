const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Two ways to configure the database connection:
//  1. DB_URL (a full postgres:// URL), handy for local development.
//  2. The standard PGHOST / PGPORT / PGUSER / PGPASSWORD / PGDATABASE variables,
//     which the pg library reads automatically (used by docker-compose).
if (!process.env.DB_URL && !process.env.PGHOST) {
  console.error('Error: set DB_URL or the PGHOST/PGUSER/PGPASSWORD/PGDATABASE variables.');
}

// With no connectionString, pg falls back to the PG* environment variables.
const pool = new Pool(
  process.env.DB_URL ? { connectionString: process.env.DB_URL } : {}
);

// Prevent unhandled errors on idle clients from crashing the server process
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
