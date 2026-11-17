import React, { useState, useRef, useEffect } from 'react';
import {
  IconBolt,
  IconChevronDown,
  IconPlus,
  IconSettings,
  IconRefresh,
  IconLogOut,
  IconUser,
  IconTerminal,
} from './Icons';

export default function Navbar({
  user,
  projects,
  activeProject,
  onSelectProject,
  onOpenNewProject,
  onOpenSettings,
  onOpenSdk,
  autoRefresh,
  onToggleAutoRefresh,
  onRefresh,
  refreshing,
  onLogout,
  onGoHome,
}) {
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const projectRef = useRef(null);
  const userRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (projectRef.current && !projectRef.current.contains(e.target)) {
        setProjectDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      style={{
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '0.75rem 1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Brand & Project Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Brand Logo */}
          <div
            onClick={onGoHome}
            title={onGoHome ? 'Back to Home' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              cursor: onGoHome ? 'pointer' : 'default',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px var(--primary-glow)',
              }}
            >
              <IconBolt size={20} color="#ffffff" />
            </div>
            <div>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                Faultline
              </span>
            </div>
          </div>

          <div style={{ height: '22px', width: '1px', background: 'var(--border-subtle)' }} />

          {/* Project Switcher Dropdown */}
          <div ref={projectRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
              className="btn-secondary"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                gap: '0.5rem',
              }}
            >
              <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeProject ? activeProject.name : 'Select Project'}
              </span>
              <IconChevronDown size={14} color="var(--text-muted)" />
            </button>

            {projectDropdownOpen && (
              <div
                className="animate-scale-in"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  width: '240px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-xl)',
                  padding: '0.4rem',
                  zIndex: 200,
                }}
              >
                <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Projects ({projects.length}/5)
                </div>

                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => {
                        onSelectProject(proj);
                        setProjectDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem',
                        fontWeight: activeProject?.id === proj.id ? 700 : 500,
                        background: activeProject?.id === proj.id ? 'var(--primary-subtle)' : 'transparent',
                        color: activeProject?.id === proj.id ? 'var(--primary)' : 'var(--text-primary)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {proj.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {proj.issue_count || 0} issues
                      </span>
                    </button>
                  ))}
                </div>

                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.35rem 0' }} />

                <button
                  onClick={() => {
                    setProjectDropdownOpen(false);
                    onOpenNewProject();
                  }}
                  disabled={projects.length >= 5}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    color: projects.length >= 5 ? 'var(--text-dim)' : 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <IconPlus size={15} />
                  <span>{projects.length >= 5 ? 'Limit reached (5/5)' : 'Create Project'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Project Settings Trigger */}
          {activeProject && (
            <button
              onClick={onOpenSettings}
              className="btn-ghost"
              title="Project Settings"
              style={{ padding: '0.45rem', color: 'var(--text-secondary)' }}
            >
              <IconSettings size={17} />
            </button>
          )}
        </div>

        {/* Right: SDK Setup, Live Polling & User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* SDK Setup Button (opens npm install instructions) */}
          <button
            onClick={onOpenSdk}
            className="btn-secondary"
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              gap: '0.45rem',
              border: '1px solid var(--border-strong)',
            }}
          >
            <IconTerminal size={16} />
            <span>SDK Setup</span>
          </button>

          {/* Live Polling Toggle Switch */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.825rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              userSelect: 'none',
              padding: '0.4rem 0.6rem',
              borderRadius: 'var(--radius-md)',
              background: autoRefresh ? 'var(--bg-subtle)' : 'transparent',
            }}
          >
            <span className={autoRefresh ? 'pulse-beacon' : ''} style={{ background: autoRefresh ? 'var(--success)' : 'var(--text-dim)' }} />
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => onToggleAutoRefresh(e.target.checked)}
              style={{ display: 'none' }}
            />
            <span style={{ fontWeight: 500 }}>{autoRefresh ? 'Live (1s)' : 'Paused'}</span>
          </label>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="btn-ghost"
            title="Refresh issues and stats"
            style={{ padding: '0.45rem', color: 'var(--text-secondary)' }}
          >
            <IconRefresh size={16} spinning={refreshing} />
          </button>

          <div style={{ height: '22px', width: '1px', background: 'var(--border-subtle)' }} />

          {/* User Account Menu */}
          <div ref={userRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="btn-ghost"
              style={{
                padding: '0.35rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                gap: '0.5rem',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </span>
              <IconChevronDown size={13} color="var(--text-dim)" />
            </button>

            {userDropdownOpen && (
              <div
                className="animate-scale-in"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: '210px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-xl)',
                  padding: '0.4rem',
                  zIndex: 200,
                }}
              >
                <div style={{ padding: '0.5rem 0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Signed in as</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.email}
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.35rem 0' }} />

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onLogout();
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    color: 'var(--danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <IconLogOut size={15} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
