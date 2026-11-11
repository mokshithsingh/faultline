const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Ensure JWT_SECRET is set for the test run if missing in local environment
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_minimum_32_characters_for_auth_testing';

const app = require('./index');
const { pool } = require('./db');

async function runTests() {
  console.log('Starting end-to-end auth, projects, and ingestion tests...\n');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const timestamp = Date.now();
    const userAEmail = `user_a_${timestamp}@example.com`;
    const userBEmail = `user_b_${timestamp}@example.com`;
    const testPassword = 'Password12345!';

    // Helper for cookie extraction
    function extractCookie(res) {
      const getSetCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
      if (getSetCookie.length > 0) {
        return getSetCookie.map((c) => c.split(';')[0]).join('; ');
      }
      const raw = res.headers.get('set-cookie');
      return raw ? raw.split(';')[0] : '';
    }

    // 1. Register User A
    console.log('1. Registering User A...');
    const regARes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAEmail, password: testPassword }),
    });
    assert.strictEqual(regARes.status, 201, 'User A registration should return 201');
    const cookieA = extractCookie(regARes);
    assert.ok(cookieA.includes('token='), 'User A response must set token cookie');
    const regAData = await regARes.json();
    assert.strictEqual(regAData.user.email, userAEmail);
    console.log('✓ User A registered and authenticated.');

    // 2. Register User B
    console.log('2. Registering User B...');
    const regBRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userBEmail, password: testPassword }),
    });
    assert.strictEqual(regBRes.status, 201, 'User B registration should return 201');
    const cookieB = extractCookie(regBRes);
    assert.ok(cookieB.includes('token='), 'User B response must set token cookie');
    const regBData = await regBRes.json();
    assert.strictEqual(regBData.user.email, userBEmail);
    console.log('✓ User B registered and authenticated.');

    // 3. User A creates Project A
    console.log('3. User A creating Project A...');
    const projARes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({ name: 'Project Alpha' }),
    });
    assert.strictEqual(projARes.status, 201, 'Project A creation should return 201');
    const projA = await projARes.json();
    assert.ok(projA.id, 'Project A must have an id');
    assert.strictEqual(typeof projA.api_key, 'string', 'Project A creation must return api_key once');
    assert.ok(projA.api_key.startsWith('flt_'), 'api_key must start with "flt_"');
    assert.strictEqual(projA.api_key.length, 68, 'api_key must be 68 characters long ("flt_" + 64 hex)');
    assert.strictEqual(projA.key_prefix, projA.api_key.slice(0, 8), 'key_prefix must be first 8 chars of api_key');

    // Verify GET /api/projects returns key_prefix and never returns raw api_key or api_key_hash
    const getProjectsARes = await fetch(`${baseUrl}/api/projects`, {
      headers: { Cookie: cookieA },
    });
    assert.strictEqual(getProjectsARes.status, 200);
    const projectsAList = await getProjectsARes.json();
    const fetchedProjA = projectsAList.find((p) => p.id === projA.id);
    assert.ok(fetchedProjA, 'Project A should be listed for User A');
    assert.strictEqual(fetchedProjA.key_prefix, projA.key_prefix);
    assert.strictEqual(fetchedProjA.api_key, undefined, 'GET /api/projects must never return api_key');
    assert.strictEqual(fetchedProjA.api_key_hash, undefined, 'GET /api/projects must never return api_key_hash');
    console.log('✓ Project A created; key format and exposure rules verified.');

    // 4. User B creates Project B
    console.log('4. User B creating Project B...');
    const projBRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieB,
      },
      body: JSON.stringify({ name: 'Project Beta' }),
    });
    assert.strictEqual(projBRes.status, 201, 'Project B creation should return 201');
    const projB = await projBRes.json();
    assert.ok(projB.id, 'Project B must have an id');
    assert.ok(projB.api_key.startsWith('flt_'));
    console.log('✓ Project B created successfully.');

    // 5. Ingest identical events under both Project A and Project B
    console.log('5. Ingesting identical events across projects...');
    const identicalPayload = {
      type: 'ReferenceError',
      message: 'foo is not defined',
      stack: 'ReferenceError: foo is not defined\n    at test.js:42:15',
    };

    const ingestARes = await fetch(`${baseUrl}/v1/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': projA.api_key,
      },
      body: JSON.stringify(identicalPayload),
    });
    assert.strictEqual(ingestARes.status, 201, 'Ingesting under Project A should succeed with 201');
    const ingestAData = await ingestARes.json();
    const issueAId = ingestAData.issueId;

    const ingestBRes = await fetch(`${baseUrl}/v1/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': projB.api_key,
      },
      body: JSON.stringify(identicalPayload),
    });
    assert.strictEqual(ingestBRes.status, 201, 'Ingesting under Project B should succeed with 201');
    const ingestBData = await ingestBRes.json();
    const issueBId = ingestBData.issueId;

    // 6. Assert same fingerprint in two projects makes two separate issues
    assert.notStrictEqual(
      issueAId,
      issueBId,
      'Same error fingerprint across two projects MUST generate distinct issue IDs'
    );
    console.log(`✓ Fingerprint isolation verified: Project A issue ID ${issueAId} !== Project B issue ID ${issueBId}.`);

    // 7. Assert User B gets 404 on User A's project for GET, PATCH, and DELETE
    console.log("7. Asserting User B gets 404 on User A's project (GET, PATCH, DELETE)...");
    const getUnownedProjRes = await fetch(`${baseUrl}/api/projects/${projA.id}`, {
      headers: { Cookie: cookieB },
    });
    assert.strictEqual(getUnownedProjRes.status, 404, 'User B GET Project A must return 404');

    const patchUnownedProjRes = await fetch(`${baseUrl}/api/projects/${projA.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieB,
      },
      body: JSON.stringify({ name: 'Hacked Name' }),
    });
    assert.strictEqual(patchUnownedProjRes.status, 404, 'User B PATCH Project A must return 404');

    const deleteUnownedProjRes = await fetch(`${baseUrl}/api/projects/${projA.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookieB },
    });
    assert.strictEqual(deleteUnownedProjRes.status, 404, 'User B DELETE Project A must return 404');
    console.log("✓ User B received 404 on all operations on User A's project.");

    // 8. Assert User B gets 404 on User A's issues for GET, PATCH, and DELETE
    console.log("8. Asserting User B gets 404 on User A's issues (GET, PATCH, DELETE)...");
    const getUnownedIssuesRes = await fetch(`${baseUrl}/api/projects/${projA.id}/issues`, {
      headers: { Cookie: cookieB },
    });
    assert.strictEqual(getUnownedIssuesRes.status, 404, 'User B GET issues for Project A must return 404');

    const getUnownedIssueDetailRes = await fetch(`${baseUrl}/api/projects/${projA.id}/issues/${issueAId}`, {
      headers: { Cookie: cookieB },
    });
    assert.strictEqual(getUnownedIssueDetailRes.status, 404, 'User B GET Issue A detail must return 404');

    const patchUnownedIssueRes = await fetch(`${baseUrl}/api/projects/${projA.id}/issues/${issueAId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieB,
      },
      body: JSON.stringify({ status: 'RESOLVED' }),
    });
    assert.strictEqual(patchUnownedIssueRes.status, 404, 'User B PATCH Issue A must return 404');

    const deleteUnownedIssueRes = await fetch(`${baseUrl}/api/projects/${projA.id}/issues/${issueAId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieB },
    });
    assert.strictEqual(deleteUnownedIssueRes.status, 404, 'User B DELETE Issue A must return 404');

    // Also assert cross-project attempt: User B accessing Issue A through Project B route
    const crossProjectGetRes = await fetch(`${baseUrl}/api/projects/${projB.id}/issues/${issueAId}`, {
      headers: { Cookie: cookieB },
    });
    assert.strictEqual(crossProjectGetRes.status, 404, 'Accessing Issue A under Project B must return 404');
    console.log("✓ User B received 404 on all issue endpoints for User A's issues.");

    // 9. Assert bad API key gets 401 on ingest
    console.log('9. Asserting bad API key returns 401 on ingest...');
    const badKeyRes = await fetch(`${baseUrl}/v1/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'flt_0000000000000000000000000000000000000000000000000000000000000000',
      },
      body: JSON.stringify(identicalPayload),
    });
    assert.strictEqual(badKeyRes.status, 401, 'Unknown API key must return 401');

    const missingKeyRes = await fetch(`${baseUrl}/v1/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(identicalPayload),
    });
    assert.strictEqual(missingKeyRes.status, 401, 'Missing API key must return 401');
    console.log('✓ Invalid and missing API keys properly rejected with 401.');

    // 10. Assert login rate limit triggers (10 attempts / 15 min / IP)
    console.log('10. Asserting login rate limiter triggers on 11th attempt...');
    const rateLimitEmail = `ratelimit_${timestamp}@example.com`;
    for (let i = 1; i <= 10; i++) {
      const attemptRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: rateLimitEmail, password: 'wrongpassword' }),
      });
      assert.strictEqual(
        attemptRes.status,
        401,
        `Attempt ${i} should fail with 401 Invalid email or password`
      );
    }

    const rateLimitedRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: rateLimitEmail, password: 'wrongpassword' }),
    });
    assert.strictEqual(
      rateLimitedRes.status,
      429,
      'Attempt 11 should be blocked by rate limiter with 429 Too Many Requests'
    );
    console.log('✓ Login rate limiting triggered successfully with 429.');

    console.log('\n=======================================');
    console.log(' ALL BACKEND AUTH & SCOPING TESTS PASSED ');
    console.log('=======================================\n');
  } finally {
    server.close();
    await pool.end();
  }
}

if (require.main === module) {
  runTests().catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
}

module.exports = { runTests };
