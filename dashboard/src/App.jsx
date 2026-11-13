import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';
import Navbar from './components/Navbar';
import AuthView from './components/AuthView';
import HomeScreen from './components/HomeScreen';
import StatsCards from './components/StatsCards';
import IssuesList from './components/IssuesList';
import IssueDetail from './components/IssueDetail';
import ProjectModal from './components/ProjectModal';
import ProjectSettingsModal from './components/ProjectSettingsModal';
import SdkSnippetModal from './components/SdkSnippetModal';
import { ToastContainer } from './components/Toast';
import { IconBolt, IconPlus, IconTerminal } from './components/Icons';

export default function App() {
  // Session & User State
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Projects State
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Issues & Metrics State
  const [stats, setStats] = useState({
    total_issues: 0,
    unresolved_issues: 0,
    resolved_issues: 0,
    total_events: 0,
  });
  const [issues, setIssues] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [issueDetail, setIssueDetail] = useState(null);

  // Loading & Polling State
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Navigation & View State
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'auth' | 'dashboard'
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  // Modals & Toasts State
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSdkModal, setShowSdkModal] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast notification helper
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Initial Session Check
  useEffect(() => {
    async function checkAuth() {
      try {
        const data = await api.getMe();
        if (data?.user) {
          setUser(data.user);
        }
      } catch (err) {
        // Not authenticated
        setUser(null);
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, []);

  // 2. Fetch Projects when user is authenticated
  const fetchProjects = useCallback(async (selectId = null) => {
    setProjectsLoading(true);
    try {
      const data = await api.getProjects();
      setProjects(data || []);

      if (data && data.length > 0) {
        if (selectId) {
          const found = data.find((p) => p.id === selectId);
          setActiveProject(found || data[0]);
        } else {
          setActiveProject((prev) => {
            if (prev) {
              const updated = data.find((p) => p.id === prev.id);
              return updated || data[0];
            }
            return data[0];
          });
        }
      } else {
        setActiveProject(null);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjects([]);
      setActiveProject(null);
      setIssues([]);
    }
  }, [user, fetchProjects]);

  // 3. Fetch Scoped Metrics and Issues for Active Project
  const fetchProjectData = useCallback(async (silent = false) => {
    if (!activeProject) return;
    if (!silent) setLoading(true);

    try {
      const [statsData, issuesData] = await Promise.all([
        api.getProjectStats(activeProject.id),
        api.getProjectIssues(activeProject.id, {
          status: filterStatus,
          search: searchQuery,
          page,
          limit: 20,
        }),
      ]);

      if (statsData) setStats(statsData);
      if (issuesData) {
        setIssues(issuesData.issues || []);
        if (issuesData.pagination) setPagination(issuesData.pagination);
      }
    } catch (err) {
      console.error('Failed to load project issues:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [activeProject, filterStatus, searchQuery, page]);

  useEffect(() => {
    if (activeProject) {
      fetchProjectData();
    }
  }, [activeProject, fetchProjectData]);

  // 4. Fetch Issue Detail
  const fetchIssueDetail = useCallback(async (issueId, silent = false) => {
    if (!activeProject || !issueId) return;
    if (!silent) setDetailLoading(true);

    try {
      const data = await api.getProjectIssueById(activeProject.id, issueId);
      setIssueDetail(data);
    } catch (err) {
      console.error('Failed to load issue detail:', err);
      showToast('Could not load issue details.', 'error');
    } finally {
      if (!silent) setDetailLoading(false);
    }
  }, [activeProject, showToast]);

  // Handle clicking on an issue
  const handleSelectIssue = (id) => {
    setSelectedIssueId(id);
    fetchIssueDetail(id);
  };

  // 5. Polling: Auto-refresh data every 1 second if enabled
  useEffect(() => {
    if (!autoRefresh || !activeProject) return;
    let isFetching = false;
    const interval = setInterval(async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        await Promise.all([
          fetchProjectData(true),
          selectedIssueId ? fetchIssueDetail(selectedIssueId, true) : Promise.resolve(),
        ]);
      } finally {
        isFetching = false;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, activeProject, fetchProjectData, fetchIssueDetail, selectedIssueId]);

  // Manual Refresh Handler
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchProjects(),
      fetchProjectData(true),
      selectedIssueId ? fetchIssueDetail(selectedIssueId, true) : Promise.resolve(),
    ]);
    setTimeout(() => setRefreshing(false), 400);
  };

  // Issue Actions: Toggle Resolution Status
  const handleToggleStatus = async (issueId, currentStatus) => {
    if (!activeProject) return;
    const newStatus = currentStatus === 'RESOLVED' ? 'UNRESOLVED' : 'RESOLVED';

    try {
      await api.updateProjectIssueStatus(activeProject.id, issueId, newStatus);
      showToast(
        newStatus === 'RESOLVED' ? 'Issue marked as resolved.' : 'Issue reopened.',
        'success'
      );
      fetchProjectData(true);
      if (selectedIssueId === issueId) {
        fetchIssueDetail(issueId, true);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update issue status.', 'error');
    }
  };

  // Issue Actions: Delete Issue
  const handleDeleteIssue = async (issueId) => {
    if (!activeProject) return;

    try {
      await api.deleteProjectIssue(activeProject.id, issueId);
      showToast('Issue deleted.', 'success');
      if (selectedIssueId === issueId) {
        setSelectedIssueId(null);
        setIssueDetail(null);
      }
      fetchProjectData(true);
    } catch (err) {
      showToast(err.message || 'Failed to delete issue.', 'error');
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await api.logout();
      setUser(null);
      setCurrentView('home');
      showToast('Logged out successfully.', 'info');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Loading spinner during initial session check
  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              animation: 'spin 1.5s linear infinite',
            }}
          >
            <IconBolt size={22} color="#ffffff" />
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Loading Faultline...
          </div>
        </div>
      </div>
    );
  }

  // 1. Home View
  if (currentView === 'home') {
    return (
      <>
        <HomeScreen
          user={user}
          onGoToDashboard={() => {
            if (user) {
              setCurrentView('dashboard');
            } else {
              setAuthMode('login');
              setCurrentView('auth');
            }
          }}
          onOpenAuth={(mode) => {
            setAuthMode(mode || 'login');
            setCurrentView('auth');
          }}
          onLogout={handleLogout}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // 2. Auth View
  if (currentView === 'auth' || !user) {
    return (
      <>
        <AuthView
          initialMode={authMode}
          onAuthSuccess={(usr) => {
            setUser(usr);
            setCurrentView('dashboard');
          }}
          onShowToast={showToast}
          onBackToHome={() => setCurrentView('home')}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar
        user={user}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={(proj) => {
          setActiveProject(proj);
          setSelectedIssueId(null);
          setIssueDetail(null);
          setPage(1);
        }}
        onOpenNewProject={() => setShowProjectModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenSdk={() => setShowSdkModal(true)}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={(enabled) => setAutoRefresh(enabled)}
        onRefresh={handleManualRefresh}
        refreshing={refreshing}
        onLogout={handleLogout}
        onGoHome={() => setCurrentView('home')}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '1240px', width: '100%', margin: '0 auto', padding: '1.75rem 1.5rem' }}>
        {projects.length === 0 ? (
          /* Empty Projects State / First-Time Onboarding */
          <div
            className="animate-fade-in-up"
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-md)',
              padding: '4rem 2rem',
              textAlign: 'center',
              maxWidth: '560px',
              margin: '3rem auto',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--primary-subtle)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <IconBolt size={28} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Welcome to Faultline
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              You don’t have any projects yet. Create your first project to get an API key and start tracking errors in real time.
            </p>
            <button
              onClick={() => setShowProjectModal(true)}
              className="btn-primary"
              style={{ padding: '0.7rem 1.4rem', fontSize: '0.925rem' }}
            >
              <IconPlus size={16} />
              <span>Create Your First Project</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Project Stats Summary Cards */}
            <StatsCards stats={stats} loading={loading} />

            {/* Either Single Issue Detail View or Issue List View */}
            {selectedIssueId ? (
              <IssueDetail
                detail={issueDetail}
                loading={detailLoading}
                onBack={() => {
                  setSelectedIssueId(null);
                  setIssueDetail(null);
                }}
                onToggleStatus={handleToggleStatus}
                onDeleteIssue={handleDeleteIssue}
                onShowToast={showToast}
              />
            ) : (
              <IssuesList
                issues={issues}
                pagination={pagination}
                filterStatus={filterStatus}
                onFilterChange={(st) => {
                  setFilterStatus(st);
                  setPage(1);
                }}
                searchQuery={searchQuery}
                onSearchChange={(q) => {
                  setSearchQuery(q);
                  setPage(1);
                }}
                onSelectIssue={handleSelectIssue}
                onToggleStatus={handleToggleStatus}
                onDeleteIssue={handleDeleteIssue}
                loading={loading}
                onPageChange={(p) => setPage(p)}
                onOpenSdk={() => setShowSdkModal(true)}
              />
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {showProjectModal && (
        <ProjectModal
          onClose={() => setShowProjectModal(false)}
          projectCount={projects.length}
          onProjectCreated={(newProj) => {
            fetchProjects(newProj.id);
          }}
          onShowToast={showToast}
        />
      )}

      {showSettingsModal && activeProject && (
        <ProjectSettingsModal
          project={activeProject}
          onClose={() => setShowSettingsModal(false)}
          onProjectUpdated={(updated) => {
            fetchProjects(updated.id);
          }}
          onProjectDeleted={(deletedId) => {
            fetchProjects();
          }}
          onShowToast={showToast}
        />
      )}

      {showSdkModal && (
        <SdkSnippetModal
          activeProject={activeProject}
          onClose={() => setShowSdkModal(false)}
          onShowToast={showToast}
        />
      )}

      {/* Floating Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
