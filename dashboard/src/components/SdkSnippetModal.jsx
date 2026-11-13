import React, { useState } from 'react';
import { IconClose, IconCopy, IconCheck, IconGitHub, IconExternalLink, IconTerminal } from './Icons';

// Configurable GitHub SDK Repo URL (Placeholder ready to be updated in the next commit)
export const GITHUB_SDK_REPO_URL = 'https://github.com/faultline/faultline-sdk';

export default function SdkSnippetModal({ activeProject, onClose, onShowToast }) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const apiKeyDisplay = activeProject?.api_key || `${activeProject?.key_prefix || 'flt_xxxx'}...`;

  const scriptSnippet = `<!-- 1. Include Faultline SDK -->
<script src="${GITHUB_SDK_REPO_URL}/releases/latest/download/faultline.min.js"></script>

<!-- 2. Initialize SDK -->
<script>
  Faultline.init({
    endpoint: '${window.location.origin}/v1/ingest',
    apiKey: '${apiKeyDisplay}'
  });
</script>`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      onShowToast?.('API Key copied to clipboard!', 'success');
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
      onShowToast?.('Code snippet copied to clipboard!', 'success');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
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
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                SDK Setup & Downloads
              </h3>
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
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* GitHub Download Highlight Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
              border: '1px solid var(--primary-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Download SDK from GitHub
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Get the official lightweight Faultline JavaScript SDK directly from GitHub.
                </p>
              </div>
              <a
                href={GITHUB_SDK_REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{
                  background: '#24292f',
                  color: '#ffffff',
                  padding: '0.55rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
                }}
              >
                <IconGitHub size={17} color="#ffffff" />
                <span>Download SDK on GitHub</span>
                <IconExternalLink size={14} color="#ffffff" />
              </a>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Repository: <code style={{ color: 'var(--primary)', fontWeight: 600 }}>{GITHUB_SDK_REPO_URL}</code>
            </div>
          </div>

          {/* Quickstart Code Snippet */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Browser HTML Integration Snippet
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(scriptSnippet, 'script')}
                className="btn-secondary"
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.775rem' }}
              >
                {copiedScript ? <IconCheck size={14} color="var(--success)" /> : <IconCopy size={14} />}
                <span>{copiedScript ? 'Copied Snippet' : 'Copy Code'}</span>
              </button>
            </div>
            <pre
              style={{
                background: '#0f172a',
                color: '#e2e8f0',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                lineHeight: 1.5,
                overflowX: 'auto',
                border: '1px solid #1e293b',
              }}
            >
              {scriptSnippet}
            </pre>
          </div>

          {/* Active Project API Key info */}
          <div
            style={{
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                Active Project Key Prefix
              </span>
              <code style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {activeProject?.key_prefix || 'flt_...'}
              </code>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'right' }}>
              Ingest Endpoint: <code style={{ color: 'var(--text-secondary)' }}>/v1/ingest</code>
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
