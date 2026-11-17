/**
 * Self-contained SDK tests. No database or Faultline server needed:
 * a tiny local HTTP server stands in for the ingest endpoint and records what it receives.
 *
 * Run: npm test
 */
const assert = require('assert');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

// Make sure auto-init does not pick up real settings from the environment
delete process.env.FAULTLINE_API_KEY;
delete process.env.FAULTLINE_ENDPOINT;

/** Starts a fake ingest server; resolves with { url, received[], close() } */
function startFakeIngest() {
  const received = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      received.push({ method: req.method, url: req.url, apiKey: req.headers['x-api-key'], body: JSON.parse(body || '{}') });
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end('{"success":true}');
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const url = `http://127.0.0.1:${server.address().port}/v1/ingest`;
      resolve({ url, received, close: () => new Promise((r) => server.close(r)) });
    });
  });
}

/** Runs a Node script in a child process with the given env; resolves with { code, stderr } */
function runChild(code, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['-e', code], {
      env: { PATH: process.env.PATH, ...env },
      cwd: __dirname,
    });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('exit', (exitCode) => resolve({ code: exitCode, stderr }));
  });
}

async function run() {
  const ingest = await startFakeIngest();
  const sdkPath = JSON.stringify(path.join(__dirname, 'index.js'));

  try {
    // 1. Without an endpoint, nothing is sent and a single warning is printed
    {
      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (...args) => warnings.push(args.join(' '));
      const Faultline = require('./index');
      await Faultline.captureException(new Error('no endpoint yet'));
      await Faultline.captureException(new Error('no endpoint yet, again'));
      console.warn = originalWarn;
      assert.strictEqual(ingest.received.length, 0, 'nothing should be sent without an endpoint');
      assert.strictEqual(warnings.length, 1, 'should warn exactly once');
      console.log('PASS: no endpoint -> nothing sent, warned once');
    }

    // 2. captureException sends type, message, stack and the x-api-key header
    {
      const Faultline = require('./index');
      Faultline.init({ endpoint: ingest.url, apiKey: 'flt_test_key' });
      await Faultline.captureException(new TypeError('boom'));
      const event = ingest.received.at(-1);
      assert.strictEqual(event.method, 'POST');
      assert.strictEqual(event.url, '/v1/ingest');
      assert.strictEqual(event.apiKey, 'flt_test_key');
      assert.strictEqual(event.body.type, 'TypeError');
      assert.strictEqual(event.body.message, 'boom');
      assert.ok(event.body.stack.includes('TypeError: boom'));
      assert.ok(!Number.isNaN(Date.parse(event.body.timestamp)));
      console.log('PASS: captureException payload and API key header');
    }

    // 3. captureMessage supports a custom type and fingerprint
    {
      const Faultline = require('./index');
      await Faultline.captureMessage('High memory', { type: 'Warning', fingerprint: 'high-memory' });
      const event = ingest.received.at(-1);
      assert.strictEqual(event.body.type, 'Warning');
      assert.strictEqual(event.body.message, 'High memory');
      assert.strictEqual(event.body.fingerprint, 'high-memory');
      console.log('PASS: captureMessage with type and fingerprint');
    }

    // 4. Auto-init from env vars + an uncaught exception is reported, then the process exits with code 1
    {
      const before = ingest.received.length;
      const result = await runChild(
        `require(${sdkPath}); setTimeout(() => { throw new RangeError('crash test'); }, 10);`,
        { FAULTLINE_API_KEY: 'flt_env_key', FAULTLINE_ENDPOINT: ingest.url }
      );
      assert.strictEqual(result.code, 1, 'process should exit with code 1');
      assert.ok(result.stderr.includes('crash test'), 'error should be printed to stderr');
      const event = ingest.received[before];
      assert.ok(event, 'crash should be reported before exiting');
      assert.strictEqual(event.apiKey, 'flt_env_key');
      assert.strictEqual(event.body.type, 'RangeError');
      console.log('PASS: env auto-init + uncaught exception reported, exit code 1');
    }

    // 5. Unhandled promise rejection is reported, then the process exits with code 1
    {
      const before = ingest.received.length;
      const result = await runChild(
        `require(${sdkPath}); Promise.reject(new Error('rejected test'));`,
        { FAULTLINE_API_KEY: 'flt_env_key', FAULTLINE_ENDPOINT: ingest.url }
      );
      assert.strictEqual(result.code, 1);
      assert.strictEqual(ingest.received[before]?.body.message, 'rejected test');
      console.log('PASS: unhandled rejection reported, exit code 1');
    }

    // 6. If the app has its own uncaughtException handler, the SDK reports but does NOT exit
    {
      const before = ingest.received.length;
      const result = await runChild(
        `require(${sdkPath});
         process.on('uncaughtException', () => {});
         setTimeout(() => { throw new Error('handled by app'); }, 10);
         setTimeout(() => process.exit(7), 1000);`,
        { FAULTLINE_API_KEY: 'flt_env_key', FAULTLINE_ENDPOINT: ingest.url }
      );
      assert.strictEqual(result.code, 7, "the app's own handler decides; SDK must not exit");
      assert.strictEqual(ingest.received[before]?.body.message, 'handled by app');
      console.log("PASS: app's own handler respected (reported, no forced exit)");
    }

    // 7. An unreachable endpoint never hangs a crashing process (gives up after ~2s)
    {
      const started = Date.now();
      const result = await runChild(
        `require(${sdkPath}); setTimeout(() => { throw new Error('offline'); }, 10);`,
        { FAULTLINE_API_KEY: 'flt_env_key', FAULTLINE_ENDPOINT: 'http://10.255.255.1:9/v1/ingest' }
      );
      const elapsed = Date.now() - started;
      assert.strictEqual(result.code, 1);
      assert.ok(elapsed < 5000, `should exit within ~2s, took ${elapsed}ms`);
      console.log(`PASS: unreachable endpoint -> still exits (${elapsed}ms)`);
    }

    console.log('\nAll SDK tests passed.');
  } finally {
    await ingest.close();
  }
}

run().catch((err) => {
  console.error('SDK test failed:', err);
  process.exit(1);
});
