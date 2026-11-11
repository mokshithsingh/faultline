const crypto = require('crypto');
const { pool } = require('../db');

/**
 * Generate a new project API key, key prefix, and SHA-256 hash.
 * Format: "flt_" + 32 random bytes as hex (68 chars total).
 * Key prefix: first 8 characters (e.g. "flt_a1b2").
 * Hash: SHA-256 hex digest (64 chars).
 */
function generateProjectKey() {
  const rawKey = 'flt_' + crypto.randomBytes(32).toString('hex');
  const keyPrefix = rawKey.slice(0, 8);
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  return { rawKey, keyPrefix, keyHash };
}

/**
 * Get all projects for the authenticated user, including issue count and last_event_at.
 * Returns key_prefix only; never exposes raw api_key or api_key_hash.
 */
async function getProjects(req, res) {
  try {
    const query = `
      SELECT
        p.id,
        p.name,
        p.key_prefix,
        p.created_at,
        p.last_event_at,
        COUNT(i.id)::int AS issue_count
      FROM projects p
      LEFT JOIN issues i ON i.project_id = p.id
      WHERE p.user_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC;
    `;
    const result = await pool.query(query, [req.user.id]);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ error: 'Failed to fetch projects.' });
  }
}

/**
 * Create a new project for the authenticated user.
 * Limit: maximum 5 projects per user.
 * Returns the full raw api_key ONCE in the response.
 */
async function createProject(req, res) {
  const { name } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
    return res.status(400).json({ error: 'Project name must be between 1 and 100 characters.' });
  }

  const projectName = name.trim();

  try {
    // Check maximum 5 projects per user
    const countResult = await pool.query(
      'SELECT COUNT(*)::int AS count FROM projects WHERE user_id = $1',
      [req.user.id]
    );

    if (countResult.rows[0].count >= 5) {
      return res.status(400).json({ error: 'Project limit reached. Maximum 5 projects allowed.' });
    }

    const { rawKey, keyPrefix, keyHash } = generateProjectKey();

    const insertQuery = `
      INSERT INTO projects (user_id, name, api_key_hash, key_prefix, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, user_id, name, key_prefix, created_at, last_event_at;
    `;

    const result = await pool.query(insertQuery, [
      req.user.id,
      projectName,
      keyHash,
      keyPrefix,
    ]);

    const project = result.rows[0];

    return res.status(201).json({
      id: project.id,
      user_id: project.user_id,
      name: project.name,
      key_prefix: project.key_prefix,
      api_key: rawKey, // Returned ONCE upon creation
      created_at: project.created_at,
      last_event_at: project.last_event_at,
      issue_count: 0,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({ error: 'Failed to create project.' });
  }
}

/**
 * Get project by ID (must belong to authenticated user).
 * Includes issue count and last_event_at.
 */
async function getProjectById(req, res) {
  const projectId = parseInt(req.params.id, 10);
  if (isNaN(projectId)) {
    return res.status(404).json({ error: 'Project not found' });
  }

  try {
    const query = `
      SELECT
        p.id,
        p.name,
        p.key_prefix,
        p.created_at,
        p.last_event_at,
        COUNT(i.id)::int AS issue_count
      FROM projects p
      LEFT JOIN issues i ON i.project_id = p.id
      WHERE p.id = $1 AND p.user_id = $2
      GROUP BY p.id;
    `;
    const result = await pool.query(query, [projectId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    return res.status(500).json({ error: 'Failed to fetch project.' });
  }
}

/**
 * Update project name (must belong to authenticated user).
 */
async function updateProject(req, res) {
  const projectId = parseInt(req.params.id, 10);
  const { name } = req.body || {};

  if (isNaN(projectId)) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (!name || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
    return res.status(400).json({ error: 'Project name must be between 1 and 100 characters.' });
  }

  try {
    const updateQuery = `
      UPDATE projects
      SET name = $1
      WHERE id = $2 AND user_id = $3
      RETURNING id, user_id, name, key_prefix, created_at, last_event_at;
    `;
    const result = await pool.query(updateQuery, [name.trim(), projectId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    return res.status(500).json({ error: 'Failed to update project.' });
  }
}

/**
 * Delete project (cascades issues and events; must belong to authenticated user).
 */
async function deleteProject(req, res) {
  const projectId = parseInt(req.params.id, 10);
  if (isNaN(projectId)) {
    return res.status(404).json({ error: 'Project not found' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id;',
      [projectId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.status(200).json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({ error: 'Failed to delete project.' });
  }
}

/**
 * Regenerate API key for a project (must belong to authenticated user).
 * Returns the new full raw api_key ONCE in the response.
 */
async function regenerateApiKey(req, res) {
  const projectId = parseInt(req.params.id, 10);
  if (isNaN(projectId)) {
    return res.status(404).json({ error: 'Project not found' });
  }

  try {
    const { rawKey, keyPrefix, keyHash } = generateProjectKey();

    const updateQuery = `
      UPDATE projects
      SET api_key_hash = $1, key_prefix = $2
      WHERE id = $3 AND user_id = $4
      RETURNING id, user_id, name, key_prefix, created_at, last_event_at;
    `;
    const result = await pool.query(updateQuery, [keyHash, keyPrefix, projectId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = result.rows[0];

    return res.status(200).json({
      id: project.id,
      user_id: project.user_id,
      name: project.name,
      key_prefix: project.key_prefix,
      api_key: rawKey, // Returned ONCE upon regeneration
      created_at: project.created_at,
      last_event_at: project.last_event_at,
    });
  } catch (error) {
    console.error('Error regenerating API key:', error);
    return res.status(500).json({ error: 'Failed to regenerate API key.' });
  }
}

module.exports = {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  regenerateApiKey,
};
