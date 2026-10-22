const Faultline = require('./index');
const app = require('../server/index');
const { pool } = require('../server/db');

async function runTests() {
  const server = app.listen(0, async () => {
    const port = server.address().port;
    const endpoint = `http://localhost:${port}/ingest`;
    const validApiKey = process.env.INGEST_API_KEY || process.env.DB_INGEST_API_KEY;

    console.log(`Starting SDK test against test server on port ${port}...`);

    try {
      await pool.query('TRUNCATE TABLE issues, events RESTART IDENTITY CASCADE;');

      // 1. Verify 401 Unauthorized without x-api-key
      const unauthorizedRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'TestError', message: 'Unauthorized test' }),
      });
      if (unauthorizedRes.status === 401) {
        console.log('PASS: Correctly rejected unauthenticated ingest request with 401.');
      } else {
        throw new Error(`Expected 401 Unauthorized, got ${unauthorizedRes.status}`);
      }

      // 2. Initialize SDK with valid apiKey
      Faultline.init({ endpoint, apiKey: validApiKey });

      // 3. Test manual exception capture via SDK
      try {
        throw new ReferenceError('sdkTestVar is not defined');
      } catch (err) {
        await Faultline.captureException(err);
      }

      // 4. Test manual message capture via SDK
      await Faultline.captureMessage('High memory consumption detected', {
        type: 'Warning',
        fingerprint: 'high-memory-warning',
      });

      // Verify database records
      const issues = await pool.query('SELECT * FROM issues ORDER BY id ASC;');
      const events = await pool.query('SELECT * FROM events ORDER BY id ASC;');

      console.log('Issues recorded:', issues.rows.length);
      console.log('Events recorded:', events.rows.length);

      if (issues.rows.length === 2 && events.rows.length === 2) {
        console.log('PASS: Authenticated SDK successfully transmitted events to the backend!');
      } else {
        throw new Error('Unexpected count of issues or events.');
      }

      // Cleanup
      await pool.query('TRUNCATE TABLE issues, events RESTART IDENTITY CASCADE;');
    } catch (err) {
      console.error('SDK test failed with error:', err);
      process.exit(1);
    } finally {
      server.close(() => {
        pool.end(() => {
          process.exit(0);
        });
      });
    }
  });
}

runTests();
