/**
 * Faultline API Client
 * Wraps backend endpoints with credentials: 'include' for session cookie handling.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Essential for sending and receiving httpOnly auth cookies
  });

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Authentication
  async register(email, password) {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async login(email, password) {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async logout() {
    return request('/api/auth/logout', {
      method: 'POST',
    });
  },

  async getMe() {
    return request('/api/auth/me');
  },

  // Projects
  async getProjects() {
    return request('/api/projects');
  },

  async createProject(name) {
    return request('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async getProject(id) {
    return request(`/api/projects/${id}`);
  },

  async updateProject(id, name) {
    return request(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },

  async deleteProject(id) {
    return request(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  },

  async regenerateApiKey(id) {
    return request(`/api/projects/${id}/regenerate-key`, {
      method: 'POST',
    });
  },

  // Project-Scoped Stats & Issues
  async getProjectStats(projectId) {
    return request(`/api/projects/${projectId}/stats`);
  },

  async getProjectIssues(projectId, { status, search, page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') {
      params.append('status', status);
    }
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);

    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/projects/${projectId}/issues${query}`);
  },

  async getProjectIssueById(projectId, issueId, { limit = 50 } = {}) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/projects/${projectId}/issues/${issueId}${query}`);
  },

  async updateProjectIssueStatus(projectId, issueId, status) {
    return request(`/api/projects/${projectId}/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async deleteProjectIssue(projectId, issueId) {
    return request(`/api/projects/${projectId}/issues/${issueId}`, {
      method: 'DELETE',
    });
  },

  async explainProjectIssue(projectId, issueId, apiKey = null) {
    return request(`/api/projects/${projectId}/issues/${issueId}/explain`, {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    });
  },
};
