# faultline-tracker

Lightweight, zero-dependency JavaScript and Node.js SDK for the Faultline error tracking platform.

## Features

- **Zero dependencies:** Ultra-lightweight footprint.
- **Universal compatibility:** Works seamlessly in Node.js and browser environments.
- **Auto-initialization:** Automatically detects and configures from environment variables or browser globals.
- **Global error catching:** Hooks into `uncaughtException`, `unhandledRejection`, `window.onerror`, and `window.onunhandledrejection`.
- **Fail-safe transport:** Error reporting failures are caught internally so your host app never crashes.

---

## Installation

```bash
npm install faultline-tracker
```

---

## Usage

### 1. Node.js

#### Automatic Configuration (Recommended)
Set environment variables in your `.env` file:
```env
FAULTLINE_API_KEY=flt_your_project_api_key_here
FAULTLINE_ENDPOINT=http://localhost:4000/v1/ingest
```

At the very top of your server entry point (`index.js`):
```javascript
require('dotenv').config();
require('faultline-tracker');
```

#### Manual Configuration
```javascript
const Faultline = require('faultline-tracker');

Faultline.init({
  apiKey: 'flt_your_project_api_key_here',
  endpoint: 'http://localhost:4000/v1/ingest',
});

// Capture handled exceptions manually
try {
  riskyOperation();
} catch (error) {
  Faultline.captureException(error);
}
```

---

### 2. Browser

#### Script Tag Auto-Init
```html
<script>
  window.FAULTLINE_API_KEY = "flt_your_project_api_key_here";
  window.FAULTLINE_ENDPOINT = "http://localhost:4000/v1/ingest";
</script>
<script src="path/to/faultline-tracker.js"></script>
```

#### Manual Initialization
```html
<script src="path/to/faultline-tracker.js"></script>
<script>
  Faultline.init({
    apiKey: 'flt_your_project_api_key_here',
    endpoint: 'http://localhost:4000/v1/ingest',
  });
</script>
```

---

## License
MIT
