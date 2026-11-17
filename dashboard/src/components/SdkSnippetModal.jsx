import React, { useState } from 'react';
import { IconClose, IconCopy, IconCheck, IconExternalLink, IconTerminal, IconKey } from './Icons';
import { copyText } from '../clipboard';

// The SDK is published on npm as "faultline-tracker"
export const SDK_PACKAGE_NAME = 'faultline-tracker';
export const SDK_NPM_URL = `https://www.npmjs.com/package/${SDK_PACKAGE_NAME}`;
// Browser builds are served straight from npm by the unpkg CDN (pinned to the 0.1.x line)
export const SDK_CDN_URL = `https://unpkg.com/${SDK_PACKAGE_NAME}@0.1/index.js`;

/**
 * A dark code block with a title and its own "Copy" button.
 */
function CodeBlock({ id, title, code, copiedId, onCopy }) {
  const isCopied = copiedId === id;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</span>
        <button
          type="button"
          onClick={() => onCopy(id, code)}
          className="btn-secondary"
          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
        >
          {isCopied ? <IconCheck size={13} color="var(--success)" /> : <IconCopy size={13} />}
          <span>{isCopied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre
        style={{
          background: '#0f172a',
          color: '#e2e8f0',
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.78rem',
          lineHeight: 1.55,
          overflowX: 'auto',
          border: '1px solid #1e293b',
          margin: 0,
        }}
      >
        {code}
      </pre>
    </div>
  );
}

export default function SdkSnippetModal({ activeProject, onClose, onShowToast }) {
  const [tab, setTab] = useState('node'); // 'node' | 'browser'
  const [copiedId, setCopiedId] = useState(null);

  // The full key is only known right after creating/regenerating it; otherwise use a placeholder
  const apiKey = activeProject?.api_key || 'flt_your_project_api_key';
  // The ingest endpoint is this same server (nginx forwards /v1/ingest to the API)
  const endpoint = `${window.location.origin}/v1/ingest`;

  const installSnippet = `npm install ${SDK_PACKAGE_NAME}`;

  const nodeEnvSnippet = `FAULTLINE_API_KEY=${apiKey}
FAULTLINE_ENDPOINT=${endpoint}`;

  const nodeCodeSnippet = `// At the very top of your entry file (e.g. index.js)
require('dotenv').config();
require('${SDK_PACKAGE_NAME}'); // auto-initializes from FAULTLINE_* env vars

// Optional: report handled errors yourself
const Faultline = require('${SDK_PACKAGE_NAME}');
try {
  riskyOperation();
} catch (err) {
  Faultline.captureException(err);
}`;

  const browserSnippet = `<!-- Add before your other scripts: auto-initializes from the data-* attributes -->
<script
  src="${SDK_CDN_URL}"
  data-api-key="${apiKey}"
  data-endpoint="${endpoint}"></script>

<!-- Optional: report handled errors yourself -->
<script>
  try {
    riskyOperation();
  } catch (err) {
    Faultline.captureException(err);
  }
</script>`;

  const handleCopy = async (id, text) => {
    if (!(await copyText(text))) {
      onShowToast?.('Could not copy. Please select the text and copy it manually.', 'error');
      return;
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
    onShowToast?.('Copied to clipboard!', 'success');
  };

  const tabButtonStyle = (active) => ({
    padding: '0.4rem 0.9rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    border: '1px solid ' + (active ? 'var(--primary-border)' : 'transparent'),
    background: active ? 'var(--primary-subtle)' : 'transparent',
    color: active ? 'var(--primary)' : 'var(--text-secondary)',
    cursor: 'pointer',
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-subtle)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconTerminal size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>SDK Setup</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Connect your app to project: <strong style={{ color: 'var(--text-primary)' }}>{activeProject?.name || 'All'}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.35rem' }}>
            <IconClose size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* npm package card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
              border: '1px solid var(--primary-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <code>{SDK_PACKAGE_NAME}</code> on npm
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Zero-dependency SDK for Node.js and the browser.
              </p>
            </div>
            <a
              href={SDK_NPM_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', textDecoration: 'none' }}
            >
              <span>View on npm</span>
              <IconExternalLink size={13} />
            </a>
          </div>

          {/* Step 1: install */}
          <CodeBlock id="install" title="1. Install" code={installSnippet} copiedId={copiedId} onCopy={handleCopy} />

          {/* Step 2: configure (Node / Browser tabs) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>2. Configure</span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button type="button" style={tabButtonStyle(tab === 'node')} onClick={() => setTab('node')}>
                  Node.js
                </button>
                <button type="button" style={tabButtonStyle(tab === 'browser')} onClick={() => setTab('browser')}>
                  Browser
                </button>
              </div>
            </div>

            {tab === 'node' ? (
              <>
                <CodeBlock id="env" title=".env" code={nodeEnvSnippet} copiedId={copiedId} onCopy={handleCopy} />
                <CodeBlock id="node" title="index.js" code={nodeCodeSnippet} copiedId={copiedId} onCopy={handleCopy} />
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  No install needed for plain HTML pages: the script is served from npm via the unpkg CDN.
                  With a bundler (Vite, webpack), use <code>import Faultline from '{SDK_PACKAGE_NAME}'</code> and
                  call <code>Faultline.init({'{ apiKey, endpoint }'})</code>.
                </p>
                <CodeBlock id="browser" title="index.html" code={browserSnippet} copiedId={copiedId} onCopy={handleCopy} />
              </>
            )}
          </div>

          {/* API key + endpoint info */}
          <div
            style={{
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <IconKey size={14} />
              <span>
                Project key prefix: <code style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeProject?.key_prefix || 'flt_...'}</code>.
                The full key is shown only once, when the project is created. Lost it? Regenerate it in Project Settings.
              </span>
            </div>
            <div>
              Ingest endpoint: <code style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{endpoint}</code>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: 'var(--bg-canvas)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
