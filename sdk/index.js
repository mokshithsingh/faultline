const config = {
  endpoint: 'http://localhost:4000/ingest',
  apiKey: null,
  enabled: true,
  isInitialized: false,
};

/**
 * Dispatches an error payload to the Faultline ingest endpoint.
 * Catches transport errors internally so reporting failures never crash the host app.
 */
async function sendEvent(payload) {
  if (!config.enabled || !config.endpoint) return;

  try {
    if (typeof fetch === 'function') {
      const headers = { 'Content-Type': 'application/json' };
      if (config.apiKey) {
        headers['x-api-key'] = config.apiKey;
      }

      await fetch(config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        // keepalive allows requests to complete even if the browser page is unloading
        keepalive: true,
      });
    }
  } catch (err) {
    console.warn('Faultline: Failed to send error event:', err.message);
  }
}

/**
 * Captures an error exception manually and forwards it to the ingest server.
 */
function captureException(error, context = {}) {
  const err = (error instanceof Error) ? error : new Error(String(error || 'Unknown error'));

  const payload = {
    type: err.name || 'Error',
    message: err.message || 'Unknown error',
    stack: err.stack || '',
    timestamp: new Date().toISOString(),
  };

  if (context.fingerprint) {
    payload.fingerprint = context.fingerprint;
  }

  return sendEvent(payload);
}

/**
 * Captures a raw diagnostic message with an auto-generated call stack.
 */
function captureMessage(message, context = {}) {
  const payload = {
    type: context.type || 'Message',
    message: String(message),
    stack: new Error().stack || '',
    timestamp: new Date().toISOString(),
  };

  if (context.fingerprint) {
    payload.fingerprint = context.fingerprint;
  }

  return sendEvent(payload);
}

/**
 * Initializes the SDK and attaches global handlers for uncaught errors and promise rejections.
 */
function init(options = {}) {
  if (options.endpoint) config.endpoint = options.endpoint;
  if (options.apiKey) config.apiKey = options.apiKey;
  if (typeof options.enabled === 'boolean') config.enabled = options.enabled;

  if (config.isInitialized) return;
  config.isInitialized = true;

  // Browser environment: catch runtime errors and unhandled promise rejections
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('error', (event) => {
      const error = event.error || new Error(event.message || 'Script error');
      captureException(error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const error = (reason instanceof Error)
        ? reason
        : new Error(String(reason || 'Unhandled Promise Rejection'));
      captureException(error);
    });
  }

  // Node.js environment: catch uncaught exceptions and unhandled promise rejections
  if (typeof process !== 'undefined' && typeof process.on === 'function') {
    process.on('uncaughtException', (err) => {
      captureException(err);
    });

    process.on('unhandledRejection', (reason) => {
      const error = (reason instanceof Error)
        ? reason
        : new Error(String(reason || 'Unhandled Promise Rejection'));
      captureException(error);
    });
  }
}

const Faultline = {
  init,
  captureException,
  captureMessage,
};

// Universal export for browser script tags, ES module bundlers, and CommonJS
if (typeof window !== 'undefined') {
  window.Faultline = Faultline;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Faultline;
}
