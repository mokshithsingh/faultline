import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = ''; // Uses Vite proxy to localhost:4000 in dev

export default function App() {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({
    total_issues: 0,
    unresolved_issues: 0,
    resolved_issues: 0,
    total_events: 0,
  });
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [issueDetail, setIssueDetail] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch issue list and aggregate stats
  const fetchData = useCallback(async () => {
    try {
      const statusParam = filterStatus !== 'ALL' ? `?status=${filterStatus}` : '';
      const [issuesRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/issues${statusParam}`),
        fetch(`${API_BASE}/issues/stats`),
      ]);

      if (issuesRes.ok && statsRes.ok) {
        const issuesData = await issuesRes.json();
        const statsData = await statsRes.json();
        setIssues(issuesData);
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  // Fetch details and event history for a selected issue
  const fetchIssueDetail = useCallback(async (id) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_BASE}/issues/${id}`);
      if (res.ok) {
        const data = await res.json();
        setIssueDetail(data);
      }
    } catch (err) {
      console.error('Failed to fetch issue details:', err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling: Auto-refresh data every 5 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
      if (selectedIssueId) {
        fetchIssueDetail(selectedIssueId);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData, fetchIssueDetail, selectedIssueId]);

  // Handle clicking an issue row
  const handleSelectIssue = (id) => {
    setSelectedIssueId(id);
    fetchIssueDetail(id);
  };

  // Toggle issue resolution status (UNRESOLVED <-> RESOLVED)
  const handleToggleStatus = async (e, issueId, currentStatus) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'RESOLVED' ? 'UNRESOLVED' : 'RESOLVED';
    try {
      const res = await fetch(`${API_BASE}/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
        if (selectedIssueId === issueId) {
          fetchIssueDetail(issueId);
        }
      }
    } catch (err) {
      console.error('Failed to update issue status:', err);
    }
  };

  // Filter issues by client search query (type or message)
  const filteredIssues = issues.filter((issue) => {
    const q = searchQuery.toLowerCase();
    return (
      issue.type.toLowerCase().includes(q) ||
      issue.message.toLowerCase().includes(q) ||
      issue.fingerprint.toLowerCase().includes(q)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--border)',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: '#090d16',
              fontSize: '1.2rem',
            }}
          >
            ⚡
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Faultline
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Developer Error Tracker
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.825rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Live polling (5s)
          </label>
          <button
            onClick={() => {
              fetchData();
              if (selectedIssueId) fetchIssueDetail(selectedIssueId);
            }}
            style={{
              background: 'var(--card)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Total Issues</span>
          <span style={statValueStyle}>{stats.total_issues}</span>
        </div>
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Unresolved</span>
          <span style={{ ...statValueStyle, color: 'var(--danger)' }}>
            {stats.unresolved_issues}
          </span>
        </div>
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Resolved</span>
          <span style={{ ...statValueStyle, color: 'var(--success)' }}>
            {stats.resolved_issues}
          </span>
        </div>
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Total Occurrences</span>
          <span style={{ ...statValueStyle, color: 'var(--primary)' }}>
            {stats.total_events}
          </span>
        </div>
      </div>

      {/* Main Content: Either Detail View or Issues List */}
      {selectedIssueId && issueDetail ? (
        /* Issue Detail View */
        <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.5rem' }}>
          {/* Back button & Actions bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button
              onClick={() => setSelectedIssueId(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--primary)',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              ← Back to issues
            </button>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={(e) => handleToggleStatus(e, issueDetail.issue.id, issueDetail.issue.status)}
                style={{
                  background: issueDetail.issue.status === 'RESOLVED' ? 'var(--card)' : 'var(--success)',
                  color: issueDetail.issue.status === 'RESOLVED' ? 'var(--text)' : '#090d16',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                {issueDetail.issue.status === 'RESOLVED' ? 'Reopen Issue' : 'Mark as Resolved'}
              </button>
            </div>
          </div>

          {/* Issue Header */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span style={typeBadgeStyle}>{issueDetail.issue.type}</span>
              <span
                style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: issueDetail.issue.status === 'RESOLVED' ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: issueDetail.issue.status === 'RESOLVED' ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {issueDetail.issue.status}
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 }}>
              {issueDetail.issue.message}
            </h2>
          </div>

          {/* Issue Metadata Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '1rem', background: 'var(--card)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block' }}>Fingerprint</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {issueDetail.issue.fingerprint}
              </span>
            </div>
            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
              <span style={{ color: 'var(--text-dim)', display: 'block' }}>Occurrences</span>
              <span style={{ fontWeight: 600 }}>{issueDetail.issue.events_count}</span>
            </div>
            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
              <span style={{ color: 'var(--text-dim)', display: 'block' }}>First Seen</span>
              <span>{formatDate(issueDetail.issue.first_seen)}</span>
            </div>
            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
              <span style={{ color: 'var(--text-dim)', display: 'block' }}>Last Seen</span>
              <span>{formatDate(issueDetail.issue.last_seen)}</span>
            </div>
          </div>

          {/* Latest Stack Trace */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Latest Stack Trace
            </h3>
            <pre
              style={{
                background: '#040711',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                overflowX: 'auto',
                fontSize: '0.825rem',
                lineHeight: 1.5,
                color: '#e2e8f0',
              }}
            >
              {issueDetail.events[0]?.stack || 'No stack trace provided for this event.'}
            </pre>
          </div>

          {/* Event Occurrences History */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Recent Occurrences ({issueDetail.events.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {issueDetail.events.map((evt) => (
                <div
                  key={evt.id}
                  style={{
                    background: 'var(--card)',
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.825rem',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>Event #{evt.id}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{evt.message}</span>
                  </div>
                  <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {formatDate(evt.timestamp || evt.received_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Issues List View */
        <div>
          {/* Controls: Filter Tabs & Search Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--panel)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              {['ALL', 'UNRESOLVED', 'RESOLVED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    background: filterStatus === status ? 'var(--card)' : 'transparent',
                    color: filterStatus === status ? 'var(--text)' : 'var(--text-dim)',
                    border: filterStatus === status ? '1px solid var(--border-light)' : '1px solid transparent',
                  }}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by error type or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '280px' }}
            />
          </div>

          {/* Issues List Container */}
          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading issues...
              </div>
            ) : filteredIssues.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No issues found</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  Trigger an error from the demo app to see it appear here in real-time.
                </p>
              </div>
            ) : (
              <div>
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => handleSelectIssue(issue.id)}
                    style={{
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease-in-out',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--card-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ maxWidth: '75%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={typeBadgeStyle}>{issue.type}</span>
                        <span
                          style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: issue.status === 'RESOLVED' ? 'var(--success-bg)' : 'var(--danger-bg)',
                            color: issue.status === 'RESOLVED' ? 'var(--success)' : 'var(--danger)',
                          }}
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
                          fontWeight: 500,
                          color: 'var(--text)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {issue.message}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary)' }}>
                          {issue.events_count} {issue.events_count === 1 ? 'event' : 'events'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {formatDate(issue.last_seen)}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleToggleStatus(e, issue.id, issue.status)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: issue.status === 'RESOLVED' ? 'var(--card)' : 'var(--success-bg)',
                          color: issue.status === 'RESOLVED' ? 'var(--text-muted)' : 'var(--success)',
                          border: `1px solid ${issue.status === 'RESOLVED' ? 'var(--border)' : 'rgba(16, 185, 129, 0.3)'}`,
                        }}
                      >
                        {issue.status === 'RESOLVED' ? 'Reopen' : 'Resolve'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const statCardStyle = {
  background: 'var(--panel)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
};

const statLabelStyle = {
  fontSize: '0.8rem',
  color: 'var(--text-dim)',
  fontWeight: 500,
};

const statValueStyle = {
  fontSize: '1.65rem',
  fontWeight: 700,
  letterSpacing: '-0.02em',
};

const typeBadgeStyle = {
  background: 'rgba(56, 189, 248, 0.12)',
  color: 'var(--primary)',
  padding: '0.2rem 0.55rem',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 600,
  border: '1px solid rgba(56, 189, 248, 0.25)',
};
