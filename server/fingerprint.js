const crypto = require('crypto');

/**
 * Normalizes file locations by stripping volatile noise (line/column numbers,
 * URL query parameters, hostnames, and absolute directory paths).
 */
function cleanLocation(loc) {
  let clean = loc.trim();
  clean = clean.replace(/:\d+(?::\d+)?\)?$/, '');
  clean = clean.replace(/[?#].*$/, '');
  clean = clean.replace(/^https?:\/\/[^/]+\//, '');
  clean = clean.replace(/\\/g, '/');

  const parts = clean.split('/').filter(Boolean);
  if (parts.length > 3) {
    clean = parts.slice(-3).join('/');
  }
  return clean;
}

/**
 * Normalizes dynamic values in error messages for fallback grouping:
 * Replaces in strict order: UUIDs -> <uuid>, emails -> <email>, numbers -> <n>.
 */
function normalizeMessage(message) {
  if (!message || typeof message !== 'string') return '';
  return message
    .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '<uuid>')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '<email>')
    .replace(/\d+/g, '<n>');
}

/**
 * Parses raw stack trace strings into structured frames (functionName@cleanLocation).
 * Skips header lines and supports both V8 and SpiderMonkey/JavaScriptCore formats.
 */
function parseFrames(stack) {
  if (!stack || typeof stack !== 'string') return [];

  const lines = stack.split('\n');
  const frames = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // V8 format: 'at functionName (filePath:line:col)' or 'at filePath:line:col'
    if (trimmed.startsWith('at ')) {
      const match = trimmed.match(/^at (?:(.+?)\s+\((.+?)\)|(.+))$/);
      if (match) {
        const fn = match[1] || '<anonymous>';
        const rawLoc = match[2] || match[3] || '';
        frames.push(`${fn}@${cleanLocation(rawLoc)}`);
        continue;
      }
    }

    // Firefox/Safari format: 'functionName@filePath:line:col' or '@filePath:line:col'
    // Skip header lines (e.g. 'TypeError: user@example.com') where colons precede '@' or line lacks ':line'
    if (trimmed.includes('@')) {
      const atIndex = trimmed.indexOf('@');
      const fn = trimmed.slice(0, atIndex).trim();
      const rawLoc = trimmed.slice(atIndex + 1).trim();

      const isHeader = fn.includes(':') || /^\w+Error/i.test(fn);
      const hasLineNumber = /:\d+(?::\d+)?\)?$/.test(rawLoc.replace(/[?#].*$/, ''));

      if (!isHeader && hasLineNumber) {
        frames.push(`${fn || '<anonymous>'}@${cleanLocation(rawLoc)}`);
      }
    }
  }

  return frames;
}

/**
 * Generates a deterministic 64-character SHA-256 fingerprint for grouping issues.
 * Uses top 3 stack frames when available, with fallback to error type and normalized message.
 */
function generateFingerprint({ type = '', message = '', stack = '' } = {}) {
  const frames = parseFrames(stack);

  let rawString = '';
  if (frames.length > 0) {
    // Top 3 frames identify the location where the bug originated
    const topFrames = frames.slice(0, 3);
    rawString = `${type}:${topFrames.join('|')}`;
  } else {
    // Fallback when stack trace has no parseable frames
    rawString = `${type}:${normalizeMessage(message)}`;
  }

  return crypto.createHash('sha256').update(rawString).digest('hex');
}

module.exports = {
  cleanLocation,
  normalizeMessage,
  parseFrames,
  generateFingerprint,
};
