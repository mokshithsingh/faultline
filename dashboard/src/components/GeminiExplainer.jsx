import React, { useState, useEffect } from 'react';
import { IconGemini, IconSparkles, IconCopy, IconCheck, IconRefresh, IconClose, IconTerminal } from './Icons';
import { api } from '../api';

function renderInlineMarkdown(text) {
  if (!text) return text;
  const parts = [];
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} style={{ color: '#0f172a', fontWeight: 700 }}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          style={{
            background: '#ede9fe',
            color: '#6d28d9',
            padding: '0.15rem 0.4rem',
            borderRadius: '4px',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
          }}
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function FormattedExplanation({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${i}`}
            style={{
              background: '#0f172a',
              color: '#38bdf8',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              overflowX: 'auto',
              margin: '0.65rem 0 1rem',
              border: '1px solid #1e293b',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h4
          key={`h4-${i}`}
          style={{
            fontSize: '0.95rem',
            fontWeight: 800,
            color: '#312e81',
            margin: '1.1rem 0 0.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            letterSpacing: '-0.01em',
          }}
        >
          {line.replace(/^###\s+/, '')}
        </h4>
      );
      continue;
    }

    if (line.startsWith('> ')) {
      elements.push(
        <div
          key={`quote-${i}`}
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            borderLeft: '3px solid #7c3aed',
            padding: '0.6rem 0.85rem',
            borderRadius: '0 6px 6px 0',
            fontSize: '0.8rem',
            color: '#475569',
            margin: '0.85rem 0',
            lineHeight: 1.5,
          }}
        >
          {renderInlineMarkdown(line.replace(/^>\s+/, ''))}
        </div>
      );
      continue;
    }

    if (line.trim() === '') {
      continue;
    }

    elements.push(
      <p
        key={`p-${i}`}
        style={{
          fontSize: '0.875rem',
          color: '#334155',
          lineHeight: 1.6,
          margin: '0.35rem 0 0.65rem',
        }}
      >
        {renderInlineMarkdown(line)}
      </p>
    );
  }

  return <div>{elements}</div>;
}

export default function GeminiExplainer({
  issue,
  projectId,
  onShowToast,
  onClose,
  initialExplain = true,
}) {
  const [loading, setLoading] = useState(false);
  const [explanationData, setExplanationData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showKeyDrawer, setShowKeyDrawer] = useState(false);
  const [customKey, setCustomKey] = useState(() => localStorage.getItem('faultline_gemini_api_key') || '');

  const fetchExplanation = async (apiKeyOverride = null) => {
    if (!issue?.id || !projectId) return;

    setLoading(true);
    try {
      const activeKey = apiKeyOverride !== null ? apiKeyOverride : (customKey.trim() || undefined);
      const data = await api.explainProjectIssue(projectId, issue.id, activeKey);
      setExplanationData(data);
      if (data?.source === 'gemini') {
        onShowToast?.('Error explained with Google Gemini AI!', 'success');
      }
    } catch (err) {
      console.error('Failed to get Gemini explanation:', err);
      onShowToast?.(err.message || 'Failed to analyze error with Gemini.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialExplain) {
      fetchExplanation();
    }
  }, [issue?.id, projectId]);

  const handleCopyExplanation = () => {
    if (!explanationData?.explanation) return;
    navigator.clipboard.writeText(explanationData.explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast?.('Gemini explanation copied to clipboard!', 'success');
  };

  const handleSaveKey = (e) => {
    e.preventDefault();
    if (customKey.trim()) {
      localStorage.setItem('faultline_gemini_api_key', customKey.trim());
      onShowToast?.('Gemini API key saved locally!', 'success');
      setShowKeyDrawer(false);
      fetchExplanation(customKey.trim());
    } else {
      localStorage.removeItem('faultline_gemini_api_key');
      onShowToast?.('Gemini API key cleared.', 'info');
      setShowKeyDrawer(false);
      fetchExplanation('');
    }
  };

  const location = explanationData?.location;

  return (
    <div className="gemini-container animate-fade-in-up" style={{ padding: '1.5rem', marginBottom: '0.25rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: '1px solid #e9d5ff',
          paddingBottom: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 8px rgba(124, 58, 237, 0.3)',
            }}
          >
            <IconGemini size={20} className={loading ? 'gemini-sparkle-pulse' : ''} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.02em' }}>
                Gemini Error Intelligence
              </h3>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  background: explanationData?.source === 'gemini' ? '#dcfce7' : '#ede9fe',
                  color: explanationData?.source === 'gemini' ? '#166534' : '#6d28d9',
                  border: `1px solid ${explanationData?.source === 'gemini' ? '#86efac' : '#ddd6fe'}`,
                }}
              >
                {explanationData?.source === 'gemini' ? 'Gemini 2.0 Flash' : 'Static Stack Analysis'}
              </span>
            </div>
            <p style={{ fontSize: '0.775rem', color: '#64748b' }}>
              Identifies the exact file coordinates, explains root cause, and provides code repairs.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {explanationData?.explanation && (
            <button
              type="button"
              onClick={handleCopyExplanation}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', background: '#ffffff' }}
              title="Copy explanation"
            >
              {copied ? <IconCheck size={14} color="var(--success)" /> : <IconCopy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchExplanation()}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', background: '#ffffff' }}
            title="Re-run analysis"
          >
            <IconRefresh size={14} className={loading ? 'gemini-sparkle-pulse' : ''} />
            <span>{loading ? 'Analyzing...' : 'Re-analyze'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowKeyDrawer(!showKeyDrawer)}
            className="btn-ghost"
            style={{ padding: '0.35rem 0.5rem', fontSize: '0.775rem', color: '#6d28d9' }}
            title="Configure Gemini API Key"
          >
            ⚙️ API Key
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              style={{ padding: '0.35rem', color: '#64748b' }}
              title="Close explanation"
            >
              <IconClose size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Optional Custom API Key Drawer */}
      {showKeyDrawer && (
        <form
          onSubmit={handleSaveKey}
          style={{
            background: '#ffffff',
            border: '1px solid #d8b4fe',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#312e81' }}>
              Custom Google Gemini API Key
            </span>
            <span style={{ fontSize: '0.725rem', color: '#64748b' }}>
              Leave blank to use server environment default (\`GEMINI_API_KEY\`)
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.775rem' }}>
              Save & Analyze
            </button>
          </div>
        </form>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div style={{ padding: '1.5rem 0.5rem', textAlign: 'center' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
              animation: 'gemini-pulse 1.5s ease-in-out infinite',
            }}
          >
            <IconGemini size={24} />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '0.35rem' }}>
            Gemini is analyzing the stack trace...
          </h4>
          <p style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '420px', margin: '0 auto' }}>
            Pinpointing the exact source file, line number, and runtime call context to generate actionable code fixes.
          </p>
        </div>
      ) : explanationData ? (
        <div>
          {/* EXACT LOCATION CALLOUT CARD */}
          {location && (
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #818cf8',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
                boxShadow: '0 2px 10px rgba(99, 102, 241, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '1.15rem' }}>📍</span>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e1b4b' }}>
                  Exact Failure Coordinates
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: '#4338ca',
                    background: '#e0e7ff',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    marginLeft: 'auto',
                  }}
                >
                  {location.file}:{location.line}:{location.column}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.85rem',
                  background: '#f8fafc',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', marginBottom: '0.15rem' }}>
                    Target File
                  </span>
                  <code style={{ fontSize: '0.825rem', fontWeight: 700, color: '#4338ca' }}>
                    {location.file}
                  </code>
                </div>

                <div>
                  <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', marginBottom: '0.15rem' }}>
                    Line & Column
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    Line {location.line}, Col {location.column}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', marginBottom: '0.15rem' }}>
                    Function / Scope
                  </span>
                  <code style={{ fontSize: '0.825rem', fontWeight: 600, color: '#0f172a' }}>
                    {location.functionName}()
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Formatted Gemini Content */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem 1.5rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            }}
          >
            <FormattedExplanation text={explanationData.explanation} />
          </div>
        </div>
      ) : null}
    </div>
  );
}