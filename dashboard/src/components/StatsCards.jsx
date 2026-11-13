import React from 'react';
import { IconAlertCircle, IconCheck, IconTerminal, IconBolt } from './Icons';

export default function StatsCards({ stats, loading }) {
  const cards = [
    {
      label: 'Total Issues',
      value: stats?.total_issues ?? 0,
      icon: <IconBolt size={18} />,
      color: 'var(--text-primary)',
      bg: 'var(--bg-subtle)',
      borderColor: 'var(--border-subtle)',
    },
    {
      label: 'Unresolved Issues',
      value: stats?.unresolved_issues ?? 0,
      icon: <IconAlertCircle size={18} />,
      color: 'var(--danger)',
      bg: 'var(--danger-subtle)',
      borderColor: 'var(--danger-border)',
    },
    {
      label: 'Resolved Issues',
      value: stats?.resolved_issues ?? 0,
      icon: <IconCheck size={18} />,
      color: 'var(--success)',
      bg: 'var(--success-subtle)',
      borderColor: 'var(--success-border)',
    },
    {
      label: 'Total Occurrences',
      value: stats?.total_events ?? 0,
      icon: <IconTerminal size={18} />,
      color: 'var(--primary)',
      bg: 'var(--primary-subtle)',
      borderColor: 'var(--primary-border)',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem',
      }}
    >
      {cards.map((card, idx) => (
        <div
          key={card.label}
          className="card-interactive animate-fade-in-up"
          style={{
            animationDelay: `${idx * 0.05}s`,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {card.label}
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: card.bg,
                color: card.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${card.borderColor}`,
              }}
            >
              {card.icon}
            </div>
          </div>

          <div>
            {loading ? (
              <div className="skeleton" style={{ height: '32px', width: '60%', borderRadius: 'var(--radius-sm)' }} />
            ) : (
              <div
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: card.color,
                  lineHeight: 1.1,
                }}
              >
                {card.value.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
