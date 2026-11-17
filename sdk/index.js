/**
 * faultline-tracker: zero-dependency error reporting SDK for Faultline.
 * Works in Node.js (18+, uses the built-in fetch) and in browsers.
 */

const config = {
  // No default endpoint: it must come from init({ endpoint }), the FAULTLINE_ENDPOINT
  // env var, window.FAULTLINE_ENDPOINT, or the script tag's data-endpoint attribute.
  endpoint: null,
  apiKey: null,
  enabled: true,
  isInitialized: false,
  warnedNoEndpoint: false,
};

// How long a crashing Node process waits for the error report to be sent before exiting
const CRASH_FLUSH_TIMEOUT_MS = 2000;

/**
 * Dispatches an error payload to the Faultline ingest endpoint.
 * Catches transport errors internally so reporting failures never crash the host app.
 */
async function sendEvent(payload) {
  if (!config.enabled) return;

  if (!config.endpoint) {
    // Warn only once, so a misconfigured app doesn't flood its own logs
    if (!config.warnedNoEndpoint) {
      config.warnedNoEndpoint = true;
      console.warn(
        'Faultline: no endpoint configured, so errors are NOT being reported. ' +
        'Set FAULTLINE_ENDPOINT or call Faultline.init({ endpoint, apiKey }).'
      );
    }
    return;
  }

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
 * Node.js only: report a fatal error, then crash the process like Node normally would.
 * Waits at most CRASH_FLUSH_TIMEOUT_MS for the report, so a slow network can't hang the app.
 * If the app registered its own handler for this event, we only report and let the app decide.
 */
function reportFatalAndExit(error, eventName) {
  const ownHandlerOnly = process.listenerCount(eventName) === 1;

  const timeout = new Promise((resolve) => {
    const timer = setTimeout(resolve, CRASH_FLUSH_TIMEOUT_MS);
    if (timer.unref) timer.unref();
  });

  Promise.race([captureException(error), timeout]).finally(() => {
    if (ownHandlerOnly) {
      // Same visible behavior as an unhandled crash: print the error and exit with code 1
      console.error(error);
      process.exit(1);
    }
  });
}

/**
 * Initializes the SDK and attaches global handlers for uncaught errors and promise rejections.
 * Calling init() again only updates the settings; handlers are attached once.
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
    return;
  }

  // Node.js environment: catch uncaught exceptions and unhandled promise rejections,
  // report them, then exit (instead of leaving the app running in a broken state)
  if (typeof process !== 'undefined' && typeof process.on === 'function') {
    process.on('uncaughtException', (err) => {
      reportFatalAndExit(err, 'uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      const error = (reason instanceof Error)
        ? reason
        : new Error(String(reason || 'Unhandled Promise Rejection'));
      reportFatalAndExit(error, 'unhandledRejection');
    });
  }
}

// Auto-initialize in Node.js if FAULTLINE_API_KEY is set (endpoint from FAULTLINE_ENDPOINT)
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.env) {
  const envApiKey = process.env.FAULTLINE_API_KEY;
  const envEndpoint = process.env.FAULTLINE_ENDPOINT;
  if (envApiKey) {
    init({
      apiKey: envApiKey,
      endpoint: envEndpoint || undefined,
    });
  }
}

// Auto-initialize in the browser from window globals or <script data-api-key data-endpoint>
if (typeof window !== 'undefined') {
  const browserKey = window.FAULTLINE_API_KEY;
  const browserEndpoint = window.FAULTLINE_ENDPOINT;
  if (browserKey) {
    init({
      apiKey: browserKey,
      endpoint: browserEndpoint || undefined,
    });
  } else if (typeof document !== 'undefined' && document.currentScript) {
    const scriptTag = document.currentScript;
    const tagKey = scriptTag.getAttribute('data-api-key');
    const tagEndpoint = scriptTag.getAttribute('data-endpoint');
    if (tagKey) {
      init({
        apiKey: tagKey,
        endpoint: tagEndpoint || undefined,
      });
    }
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
