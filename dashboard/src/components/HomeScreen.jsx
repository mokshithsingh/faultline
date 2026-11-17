import React from 'react';
import {
  IconBolt,
  IconArrowRight,
  IconCheck,
  IconShield,
  IconZap,
  IconActivity,
  IconExternalLink,
  IconGitHub,
  IconUser,
  IconLogOut,
} from './Icons';

export default function HomeScreen({
  user,
  onGoToDashboard,
  onOpenAuth,
  onLogout,
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-canvas)' }}>
      {/* Top Navbar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '0.85rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div
              style={{
                width: '36px',
                height: '36px',
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
            <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              Faultline
            </span>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
            <a href="#features" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Features
            </a>
            <a href="http://localhost:5000" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>Live Demo App</span>
              <IconExternalLink size={14} />
            </a>
          </nav>

          {/* User / Action CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-subtle)',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <IconUser size={14} color="var(--primary)" />
                  <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={onGoToDashboard}
                  className="btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <span>Dashboard</span>
                  <IconArrowRight size={15} />
                </button>
                <button
                  onClick={onLogout}
                  className="btn-ghost"
                  title="Sign out"
                  style={{ padding: '0.5rem' }}
                >
                  <IconLogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 0.95rem', fontSize: '0.85rem' }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="btn-primary"
                  style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
                >
                  <span>Get Started</span>
                  <IconArrowRight size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          padding: '5rem 1.5rem 4rem',
          textAlign: 'center',
          background: 'radial-gradient(ellipse at 50% 10%, rgba(79, 70, 229, 0.08) 0%, rgba(248, 250, 252, 0) 70%)',
        }}
      >
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          {/* Badge */}
          <div
            className="animate-fade-in"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.9rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--primary-subtle)',
              border: '1px solid var(--primary-border)',
              color: 'var(--primary)',
              fontSize: '0.825rem',
              fontWeight: 700,
              marginBottom: '1.5rem',
            }}
          >
            <IconZap size={14} />
            <span>Developer-First Real-Time Error Tracking</span>
          </div>

          {/* Heading */}
          <h1
            className="animate-fade-in-up"
            style={{
              fontSize: '3.25rem',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.04em',
              color: 'var(--text-primary)',
              marginBottom: '1.25rem',
            }}
          >
            Catch bugs in real time.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Before your users do.
            </span>
          </h1>

          {/* Subheading */}
          <p
            className="animate-fade-in-up"
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: '680px',
              margin: '0 auto 2.25rem',
            }}
          >
            Instant error ingestion, intelligent SHA-256 fingerprint grouping, and live real-time
            dashboards engineered for speed and developer clarity.
          </p>

          {/* Hero CTAs */}
          <div
            className="animate-fade-in-up"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            {user ? (
              <button
                onClick={onGoToDashboard}
                className="btn-primary"
                style={{ padding: '0.8rem 1.75rem', fontSize: '1rem', fontWeight: 700, gap: '0.6rem' }}
              >
                <span>Launch Dashboard</span>
                <IconArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={() => onOpenAuth('register')}
                className="btn-primary"
                style={{ padding: '0.8rem 1.75rem', fontSize: '1rem', fontWeight: 700, gap: '0.6rem' }}
              >
                <span>Get Started Free</span>
                <IconArrowRight size={18} />
              </button>
            )}

            <a
              href="http://localhost:5000"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ padding: '0.8rem 1.4rem', fontSize: '1rem', fontWeight: 600, gap: '0.5rem', textDecoration: 'none' }}
            >
              <span>Interactive Demo App</span>
              <IconExternalLink size={16} />
            </a>
          </div>

          {/* Quick Value Metrics */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2rem',
              marginTop: '2.5rem',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <IconCheck size={16} color="var(--success)" />
              <span>Zero-dependency SDK</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <IconCheck size={16} color="var(--success)" />
              <span>Instant live updates</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <IconCheck size={16} color="var(--success)" />
              <span>Secure SHA-256 API keys</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="features"
        style={{
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '5rem 1.5rem',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Engineered for developer clarity
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto' }}>
              Everything you need to capture, isolate, and debug exceptions without the enterprise bloat.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {/* Feature 1 */}
            <div
              className="card"
              style={{
                background: 'var(--bg-canvas)',
                padding: '1.75rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconActivity size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Instant Live Feed
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  Watch errors stream into your dashboard live as they occur in real time, with automatic in-flight concurrency guards.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div
              className="card"
              style={{
                background: 'var(--bg-canvas)',
                padding: '1.75rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconZap size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Intelligent Fingerprinting
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  Stack traces, file names, line numbers, and error messages are normalized to prevent duplicate alerts and cluster identical issues cleanly.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div
              className="card"
              style={{
                background: 'var(--bg-canvas)',
                padding: '1.75rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconShield size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Hashed SHA-256 API Keys
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  Raw keys are never stored in the database. Scoped project permissions ensure each application remains strictly segregated.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section
        style={{
          padding: '4.5rem 1.5rem',
          textAlign: 'center',
          background: 'radial-gradient(ellipse at bottom, rgba(79, 70, 229, 0.06) 0%, transparent 70%)',
        }}
      >
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Ready to track errors in real time?
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
            Jump into the dashboard or launch the live test sandbox.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {user ? (
              <button
                onClick={onGoToDashboard}
                className="btn-primary"
                style={{ padding: '0.75rem 1.6rem', fontSize: '0.95rem', fontWeight: 700 }}
              >
                Open Dashboard
              </button>
            ) : (
              <button
                onClick={() => onOpenAuth('register')}
                className="btn-primary"
                style={{ padding: '0.75rem 1.6rem', fontSize: '0.95rem', fontWeight: 700 }}
              >
                Create Free Account
              </button>
            )}
            <a
              href="http://localhost:5000"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ padding: '0.75rem 1.4rem', fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none' }}
            >
              Open Demo App
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-subtle)',
          padding: '2rem 1.5rem',
          background: 'var(--bg-surface)',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconBolt size={16} color="var(--primary)" />
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Faultline</span>
            <span>— Lightweight Error Tracker</span>
          </div>
          <div>
            Built with Node.js, Express, PostgreSQL & React
          </div>
        </div>
      </footer>
    </div>
  );
}
