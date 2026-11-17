# faultline-tracker

Zero-dependency JavaScript and Node.js SDK for the [Faultline](https://github.com/mokshithsingh/faultline) error tracker.

- **Zero dependencies.** One small file.
- **Node.js and browsers.** Node 18+ (uses the built-in `fetch`) and all modern browsers.
- **Automatic capture.** Uncaught exceptions and unhandled promise rejections are reported for you.
- **Fail-safe.** If reporting fails, your app is never affected.

You need a running Faultline server and a **project API key** (`flt_...`) from its dashboard
(create a project; the key is shown once).

---

## Node.js

```bash
npm install faultline-tracker
```

### Option 1: environment variables (recommended)

`.env`:
```env
FAULTLINE_API_KEY=flt_your_project_api_key
FAULTLINE_ENDPOINT=https://your-faultline-server/v1/ingest
```

At the very top of your entry file:
```javascript
require('dotenv').config();
require('faultline-tracker'); // auto-initializes when FAULTLINE_API_KEY is set
```

### Option 2: configure in code
```javascript
const Faultline = require('faultline-tracker');

Faultline.init({
  apiKey: 'flt_your_project_api_key',
  endpoint: 'https://your-faultline-server/v1/ingest',
});
```

### What happens on a crash
When an uncaught exception or unhandled rejection occurs, the SDK reports it, waits up to
2 seconds for the report to be sent, prints the error and exits with code `1`, just as Node
would without the SDK. If your app registers its **own** `uncaughtException` /
`unhandledRejection` handler, the SDK only reports the error and leaves the decision to you.

---

## Browser

### Script tag (no build step)
```html
<script
  src="https://unpkg.com/faultline-tracker@0.1/index.js"
  data-api-key="flt_your_project_api_key"
  data-endpoint="https://your-faultline-server/v1/ingest"></script>
```

Alternatively, set `window.FAULTLINE_API_KEY` and `window.FAULTLINE_ENDPOINT` before loading the script.

### With a bundler (Vite, webpack, ...)
```javascript
import Faultline from 'faultline-tracker';

Faultline.init({
  apiKey: 'flt_your_project_api_key',
  endpoint: 'https://your-faultline-server/v1/ingest',
});
```

> The API key is visible to anyone who opens your page. It only allows **sending** errors to
> your project, not reading them.

---

## API

| Function | Description |
|---|---|
| `init({ apiKey, endpoint, enabled })` | Configure the SDK and install global error handlers. Calling it again updates the settings. |
| `captureException(error, { fingerprint })` | Report a caught error. Returns a Promise. |
| `captureMessage(message, { type, fingerprint })` | Report a message with the current call stack. Returns a Promise. |

`fingerprint` (optional, up to 64 characters) groups events into one issue yourself, instead of
Faultline grouping them by stack trace.

If no endpoint is configured, the SDK prints a single warning and sends nothing.

---

## License
MIT
