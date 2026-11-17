import React, { useState } from 'react';
import { copyText } from '../clipboard';
import { IconClose, IconKey, IconCopy, IconCheck, IconAlertCircle, IconBolt } from './Icons';
import { api } from '../api';

export default function ProjectModal({ onClose, onProjectCreated, onShowToast, projectCount = 0 }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdProject, setCreatedProject] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Project name is required.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.createProject(cleanName);
      setCreatedProject(data);
      onProjectCreated?.(data);
      onShowToast?.(`Project "${data.name}" created!`, 'success');
    } catch (err) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!createdProject?.api_key) return;
    if (!(await copyText(createdProject.api_key))) {
      onShowToast?.('Could not copy. Please select the key and copy it manually.', 'error');
      return;
    }
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    onShowToast?.('API Key copied to clipboard!', 'success');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
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
                background: createdProject ? 'var(--success-subtle)' : 'var(--primary-subtle)',
                color: createdProject ? 'var(--success)' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {createdProject ? <IconCheck size={18} /> : <IconBolt size={18} />}
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {createdProject ? 'Project Created Successfully' : 'Create New Project'}
            </h3>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.35rem' }}>
            <IconClose size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem' }}>
          {createdProject ? (
            /* API Key Reveal Screen */
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  background: 'var(--warning-subtle)',
                  border: '1px solid var(--warning-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  fontSize: '0.825rem',
                  color: 'var(--warning)',
                }}
              >
                <IconAlertCircle size={16} style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                <span>
                  <strong>Important:</strong> Copy your project API key now. For security purposes, this secret key will <strong>never be shown again</strong>.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Project API Key
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#0f172a',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #1e293b',
                  }}
                >
                  <code
                    style={{
                      flex: 1,
                      color: '#38bdf8',
                      fontSize: '0.8rem',
                      overflowX: 'auto',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {createdProject.api_key}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="btn-primary"
                    style={{
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.8rem',
                      background: copiedKey ? 'var(--success)' : 'var(--primary)',
                    }}
                  >
                    {copiedKey ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button onClick={onClose} className="btn-primary" style={{ width: '100%', padding: '0.65rem' }}>
                  Done & Go to Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {error && (
                <div
                  className="animate-fade-in"
                  style={{
                    background: 'var(--danger-subtle)',
                    border: '1px solid var(--danger-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.825rem',
                    color: 'var(--danger)',
                  }}
                >
                  <IconAlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.4rem',
                  }}
                >
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Production Web App"
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.35rem', display: 'block' }}>
                  Up to 5 projects per user ({projectCount}/5 currently created).
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading || projectCount >= 5} className="btn-primary">
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
