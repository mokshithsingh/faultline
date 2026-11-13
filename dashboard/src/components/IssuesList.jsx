import React from 'react';
import {
  IconSearch,
  IconCheck,
  IconRefresh,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconAlertCircle,
  IconTerminal,
} from './Icons';

export default function IssuesList({
  issues,
  pagination,
  filterStatus,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onSelectIssue,
  onToggleStatus,
  onDeleteIssue,
  loading,
  onPageChange,
  onOpenSdk,
}) {
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Top Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'var(--bg-surface)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        {/* Status Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.35rem',
            background: 'var(--bg-subtle)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {['ALL', 'UNRESOLVED', 'RESOLVED'].map((status) => (
            <button
              key={status}
              onClick={() => onFilterChange(status)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: filterStatus === status ? 'var(--bg-surface)' : 'transparent',
                color: filterStatus === status ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: filterStatus === status ? 'var(--shadow-xs)' : 'none',
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search Input Box */}
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <div
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <IconSearch size={15} />
          </div>
          <input
            type="text"
            placeholder="Search errors by type or message..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '2.25rem',
              fontSize: '0.825rem',
            }}
          />
        </div>
      </div>

      {/* Issues List Container */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <div className="skeleton" style={{ height: '48px', marginBottom: '0.75rem', borderRadius: 'var(--radius-md)' }} />
            <div className="skeleton" style={{ height: '48px', marginBottom: '0.75rem', borderRadius: 'var(--radius-md)' }} />
            <div className="skeleton" style={{ height: '48px', borderRadius: 'var(--radius-md)' }} />
          </div>
        ) : issues.length === 0 ? (
          <div
            style={{
              padding: '4rem 1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--bg-subtle)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <IconCheck size={24} color="var(--success)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              No issues found
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', marginBottom: '1.25rem' }}>
              {searchQuery
                ? 'No issues match your search query. Try clearing the filter.'
                : 'All clear! Trigger errors from your application or test using the Faultline SDK.'}
            </p>
            {!searchQuery && (
              <button onClick={onOpenSdk} className="btn-secondary" style={{ fontSize: '0.825rem' }}>
                <IconTerminal size={15} />
                <span>View SDK Integration Guide</span>
              </button>
            )}
          </div>
        ) : (
          <div>
            {issues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue.id)}
                className="card-interactive"
                style={{
                  padding: '1.1rem 1.35rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  gap: '1rem',
                  background: 'var(--bg-surface)',
                }}
              >
                {/* Left: Issue Meta & Message */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-type">{issue.type}</span>
                    <span
                      className={`badge ${
                        issue.status === 'RESOLVED' ? 'badge-resolved' : 'badge-unresolved'
                      }`}
                    >
                      {issue.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      #{issue.id}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.925rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {issue.message}
                  </div>
                </div>

                {/* Right: Occurrence Counter, Timestamp & Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>
                      {issue.events_count} {issue.events_count === 1 ? 'event' : 'events'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatDate(issue.last_seen)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(issue.id, issue.status);
                      }}
                      className={issue.status === 'RESOLVED' ? 'btn-secondary' : 'btn-primary'}
                      style={{
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.775rem',
                        fontWeight: 600,
                        background: issue.status === 'RESOLVED' ? 'var(--bg-subtle)' : 'var(--success)',
                        borderColor: issue.status === 'RESOLVED' ? 'var(--border-subtle)' : 'transparent',
                        color: issue.status === 'RESOLVED' ? 'var(--text-secondary)' : '#ffffff',
                      }}
                    >
                      {issue.status === 'RESOLVED' ? (
                        <>
                          <IconRefresh size={13} />
                          <span>Reopen</span>
                        </>
                      ) : (
                        <>
                          <IconCheck size={13} />
                          <span>Resolve</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this issue and its event history?')) {
                          onDeleteIssue(issue.id);
                        }
                      }}
                      className="btn-ghost"
                      style={{ padding: '0.4rem', color: 'var(--text-dim)' }}
                      title="Delete issue"
                    >
                      <IconTrash size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {pagination && pagination.totalPages > 1 && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              background: 'var(--bg-canvas)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.825rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div>
              Showing page <strong style={{ color: 'var(--text-primary)' }}>{pagination.page}</strong> of{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{pagination.totalPages}</strong> ({pagination.total} total)
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
              >
                <IconChevronLeft size={14} />
                <span>Previous</span>
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
              >
                <span>Next</span>
                <IconChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
