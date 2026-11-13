import React from 'react';
import { IconCheck, IconAlertCircle, IconClose } from './Icons';

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        maxWidth: '380px',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${
              toast.type === 'error'
                ? 'var(--danger-border)'
                : toast.type === 'success'
                ? 'var(--success-border)'
                : 'var(--border-subtle)'
            }`,
            borderRadius: 'var(--radius-lg)',
            padding: '0.75rem 1rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            animation: 'toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background:
                toast.type === 'error'
                  ? 'var(--danger-subtle)'
                  : toast.type === 'success'
                  ? 'var(--success-subtle)'
                  : 'var(--primary-subtle)',
              color:
                toast.type === 'error'
                  ? 'var(--danger)'
                  : toast.type === 'success'
                  ? 'var(--success)'
                  : 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {toast.type === 'error' ? (
              <IconAlertCircle size={14} />
            ) : (
              <IconCheck size={14} />
            )}
          </div>
          <div style={{ flex: 1, lineHeight: 1.4, fontWeight: 500 }}>
            {toast.message}
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            style={{
              color: 'var(--text-dim)',
              padding: '0.2rem',
              borderRadius: 'var(--radius-sm)',
            }}
            title="Dismiss"
          >
            <IconClose size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
