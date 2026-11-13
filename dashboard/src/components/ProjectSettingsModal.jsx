import React, { useState } from 'react';
import { IconClose, IconSettings, IconKey, IconTrash, IconCheck, IconCopy, IconAlertCircle } from './Icons';
import { api } from '../api';

export default function ProjectSettingsModal({ project, onClose, onProjectUpdated, onProjectDeleted, onShowToast }) {
  const [name, setName] = useState(project?.name || '');
  const [renameLoading, setRenameLoading] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleRename = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === project.name) return;

    setRenameLoading(true);
    setError('');
    try {
      const updated = await api.updateProject(project.id, name.trim());
      onProjectUpdated?.(updated);
      onShowToast?.('Project renamed successfully!', 'success');
    } catch (err) {
      setError(err.message || 'Failed to update project name.');
    } finally {
      setRenameLoading(false);
    }
  };

  const handleRegenerateKey = async () => {
    const ok = window.confirm(
      'Are you sure you want to regenerate the API key? The previous key will stop working immediately.'
    );
    if (!ok) return;

    setRegenLoading(true);
    setError('');
    try {
      const result = await api.regenerateApiKey(project.id);
      setNewKey(result.api_key);
      onProjectUpdated?.(result);
      onShowToast?.('New API key generated!', 'success');
    } catch (err) {
      setError(err.message || 'Failed to regenerate API key.');
    } finally {
      setRegenLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setError('');
    try {
      await api.deleteProject(project.id);
      onShowToast?.(`Project "${project.name}" deleted.`, 'success');
      onProjectDeleted?.(project.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete project.');
      setDeleteLoading(false);
    }
  };

  const handleCopyNewKey = () => {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    onShowToast?.('New API Key copied to clipboard!', 'success');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        {/* Header */}
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
              <IconSettings size={18} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Project Settings: {project?.name}
            </h3>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.35rem' }}>
            <IconClose size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

          {/* Rename Section */}
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Project Name
            </label>
            <form onSubmit={handleRename} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={name}
                maxLength={100}
                onChange={(e) => setName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                disabled={renameLoading || !name.trim() || name.trim() === project.name}
                className="btn-secondary"
              >
                {renameLoading ? 'Saving...' : 'Rename'}
              </button>
            </form>
          </div>

          {/* API Key Section */}
          <div
            style={{
              background: 'var(--bg-subtle)',
              padding: '1.1rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Ingestion API Key
                </h4>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  Key Prefix: <code style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{project.key_prefix}</code>
                </p>
              </div>
              <button
                type="button"
                onClick={handleRegenerateKey}
                disabled={regenLoading}
                className="btn-secondary"
                style={{ fontSize: '0.775rem', padding: '0.4rem 0.75rem' }}
              >
                <IconKey size={14} />
                <span>{regenLoading ? 'Generating...' : 'Regenerate Key'}</span>
              </button>
            </div>

            {newKey && (
              <div
                className="animate-fade-in"
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: '#0f172a',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <code style={{ flex: 1, color: '#38bdf8', fontSize: '0.775rem', overflowX: 'auto' }}>
                  {newKey}
                </code>
                <button
                  type="button"
                  onClick={handleCopyNewKey}
                  className="btn-primary"
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    background: copiedKey ? 'var(--success)' : 'var(--primary)',
                  }}
                >
                  {copiedKey ? <IconCheck size={13} /> : <IconCopy size={13} />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div
            style={{
              border: '1px solid var(--danger-border)',
              background: 'var(--danger-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.1rem',
            }}
          >
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.25rem' }}>
              Delete Project
            </h4>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              Permanently removes this project along with all associated issues, stack traces, and error events.
            </p>
            {confirmDelete ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleDelete}
                  className="btn-danger"
                >
                  <IconTrash size={14} />
                  <span>{deleteLoading ? 'Deleting...' : 'Confirm Delete Project'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="btn-ghost"
                  style={{ fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="btn-danger"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
              >
                <IconTrash size={14} />
                <span>Delete this project...</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
