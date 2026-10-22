const http = require('http');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables for the ingest API key
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.DEMO_PORT || 5000;

const server = http.createServer((req, res) => {
  // Expose API key securely to the local demo UI without hardcoding in HTML
  if (req.url === '/config.js') {
    const key = process.env.INGEST_API_KEY || process.env.DB_INGEST_API_KEY || '';
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    return res.end(`window.FAULTLINE_API_KEY = ${JSON.stringify(key)};`);
  }

  // Route /sdk.js directly to the SDK source file
  if (req.url === '/sdk.js') {
    const sdkPath = path.resolve(__dirname, '../sdk/index.js');
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
