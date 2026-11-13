import React, { useState } from 'react';
import {
  IconArrowLeft,
  IconCheck,
  IconRefresh,
  IconTrash,
  IconCopy,
  IconChevronDown,
  IconChevronRight,
  IconTerminal,
} from './Icons';

export default function IssueDetail({
  detail,
  loading,
  onBack,
  onToggleStatus,
  onDeleteIssue,
  onShowToast,
}) {
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [copiedStack, setCopiedStack] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState(null);

  if (loading || !detail || !detail.issue) {
    return (
      <div className="animate-fade-in" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: '40px', width: '200px', marginBottom: '1.5rem', borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ height: '120px', marginBottom: '1rem', borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton" style={{ height: '240px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  const { issue, events = [] } = detail;
  const latestEvent = events[0];

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const copyFingerprint = () => {
    navigator.clipboard.writeText(issue.fingerprint);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
    onShowToast?.('Fingerprint copied to clipboard!', 'success');
  };

  const copyStackTrace = () => {
    const stack = latestEvent?.stack || 'No stack trace available';
    navigator.clipboard.writeText(stack);
    setCopiedStack(true);
    setTimeout(() => setCopiedStack(false), 2000);
    onShowToast?.('Stack trace copied to clipboard!', 'success');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Navigation Bar: Back & Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <button
          onClick={onBack}
          className="btn-ghost"
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--primary)',
            padding: '0.4rem 0.6rem',
            marginLeft: '-0.6rem',
          }}
        >
          <IconArrowLeft size={16} />
          <span>Back to issues</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => onToggleStatus(issue.id, issue.status)}
            className={issue.status === 'RESOLVED' ? 'btn-secondary' : 'btn-primary'}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              background: issue.status === 'RESOLVED' ? 'var(--bg-subtle)' : 'var(--success)',
              color: issue.status === 'RESOLVED' ? 'var(--text-secondary)' : '#ffffff',
            }}
          >
            {issue.status === 'RESOLVED' ? (
              <>
                <IconRefresh size={14} />
                <span>Reopen Issue</span>
              </>
            ) : (
              <>
                <IconCheck size={14} />
                <span>Mark as Resolved</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete this issue and all its historical occurrences?')) {
                onDeleteIssue(issue.id);
                onBack();
              }
            }}
            className="btn-danger"
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.825rem' }}
            title="Delete issue"
          >
            <IconTrash size={15} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Issue Header Card */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          padding: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <span className="badge badge-type" style={{ fontSize: '0.8rem', padding: '0.25rem 0.7rem' }}>
            {issue.type}
          </span>
          <span
            className={`badge ${
              issue.status === 'RESOLVED' ? 'badge-resolved' : 'badge-unresolved'
            }`}
            style={{ fontSize: '0.8rem', padding: '0.25rem 0.7rem' }}
          >
            {issue.status}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            Issue #{issue.id}
          </span>
        </div>

        <h1
          style={{
            fontSize: '1.35rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
            marginBottom: '1.25rem',
          }}
        >
          {issue.message}
        </h1>

        {/* Issue Metadata Pills */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.25rem',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
              Fingerprint
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <code style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {issue.fingerprint.slice(0, 16)}...
              </code>
              <button
                type="button"
                onClick={copyFingerprint}
                className="btn-ghost"
                style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                title="Copy SHA-256 fingerprint"
              >
                {copiedFingerprint ? <IconCheck size={13} color="var(--success)" /> : <IconCopy size={13} />}
              </button>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
              Total Occurrences
            </span>
            <span style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--primary)' }}>
              {issue.events_count}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
              First Seen
            </span>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {formatDate(issue.first_seen)}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
              Last Seen
            </span>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {formatDate(issue.last_seen)}
            </span>
          </div>
        </div>
      </div>

      {/* Latest Stack Trace Card */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-canvas)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconTerminal size={17} color="var(--primary)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Latest Stack Trace
            </h3>
          </div>
          <button
            type="button"
            onClick={copyStackTrace}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem' }}
          >
            {copiedStack ? <IconCheck size={14} color="var(--success)" /> : <IconCopy size={14} />}
            <span>{copiedStack ? 'Copied' : 'Copy Stack'}</span>
          </button>
        </div>

        <pre
          style={{
            background: '#090d16',
            color: '#f8fafc',
            padding: '1.25rem 1.5rem',
            fontSize: '0.825rem',
            lineHeight: 1.6,
            overflowX: 'auto',
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {latestEvent?.stack || 'No stack trace captured for this issue.'}
        </pre>
      </div>

      {/* Recent Occurrences History */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-canvas)',
          }}
        >
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Recent Occurrences ({events.length})
          </h3>
        </div>

        <div>
          {events.map((evt) => {
            const isExpanded = expandedEventId === evt.id;
            return (
              <div
                key={evt.id}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  padding: '0.85rem 1.5rem',
                  transition: 'background 0.15s ease',
                }}
              >
                <div
                  onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: '0.2rem', color: 'var(--text-dim)' }}
                    >
                      {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                    </button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Event #{evt.id}
                    </span>
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      {evt.message}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {formatDate(evt.timestamp || evt.received_at)}
                  </span>
                </div>

                {isExpanded && (
                  <div className="animate-fade-in" style={{ marginTop: '0.75rem', paddingLeft: '1.75rem' }}>
                    <pre
                      style={{
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-primary)',
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.775rem',
                        lineHeight: 1.5,
                        overflowX: 'auto',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {evt.stack || 'No specific stack trace.'}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
