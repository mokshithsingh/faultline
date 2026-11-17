const http = require('http');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables for the ingest API key and endpoint
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Automatically initialize SDK in Node.js demo server if available
try {
  require('faultline-tracker');
} catch (_) {
  try {
    require('faultline-sdk');
  } catch (_) {
    // Optional: SDK not installed
  }
}

const PORT = process.env.DEMO_PORT || 5000;

function resolveSdkPath() {
  try {
    return require.resolve('faultline-tracker');
  } catch (_) {
    try {
      return require.resolve('faultline-sdk');
    } catch (_) {
      const localFallback = path.resolve(__dirname, '../sdk/index.js');
      if (fs.existsSync(localFallback)) {
        return localFallback;
      }
    }
  }
  return null;
}

const server = http.createServer((req, res) => {
  // Expose API key and ingest endpoint dynamically to the browser UI
  if (req.url === '/config.js') {
    const key = process.env.FAULTLINE_API_KEY || process.env.INGEST_API_KEY || process.env.DB_INGEST_API_KEY || '';
    const endpoint = process.env.FAULTLINE_ENDPOINT || 'http://localhost:4000/v1/ingest';
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    return res.end(
      `window.FAULTLINE_API_KEY = ${JSON.stringify(key)};\n` +
      `window.FAULTLINE_ENDPOINT = ${JSON.stringify(endpoint)};`
    );
  }

  // Route /sdk.js directly to the resolved SDK package
  if (req.url === '/sdk.js') {
    const sdkPath = resolveSdkPath();
    if (!sdkPath) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('Error: Faultline SDK package not found. Add "faultline-tracker" to package.json and run npm install.');
    }

    fs.readFile(sdkPath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Error loading SDK');
      }
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(data);
    });
    return;
  }

  // Serve demo index.html for all other page requests
  const htmlPath = path.resolve(__dirname, 'index.html');
  fs.readFile(htmlPath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('Error loading demo page');
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Faultline Demo App running at http://localhost:${PORT}`);
});
