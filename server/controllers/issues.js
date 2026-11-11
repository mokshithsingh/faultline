const { pool } = require('../db');

/**
 * Verify if the project belongs to the authenticated user.
 */
async function verifyProjectOwnership(projectId, userId) {
  const result = await pool.query(
    'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return result.rows.length > 0;
}

/**
 * Controller for retrieving aggregate metrics scoped to a specific project.
 * Returns 404 if the project is not owned by the user.
 */
async function getProjectStats(req, res) {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) {
    return res.status(404).json({ error: 'Project not found' });
  }

  try {
    const isOwner = await verifyProjectOwnership(projectId, req.user.id);
    if (!isOwner) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const statsQuery = `
      SELECT
        COUNT(*)::int AS total_issues,
        COUNT(*) FILTER (WHERE i.status = 'UNRESOLVED')::int AS unresolved_issues,
        COUNT(*) FILTER (WHERE i.status = 'RESOLVED')::int AS resolved_issues,
        COALESCE(SUM(i.events_count), 0)::int AS total_events
      FROM issues i
      JOIN projects p ON p.id = i.project_id
      WHERE i.project_id = $1 AND p.user_id = $2;
    `;
    const result = await pool.query(statsQuery, [projectId, req.user.id]);
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching project issue stats:', error);
    return res.status(500).json({ error: 'Failed to fetch project issue statistics.' });
  }
}

/**
 * Controller for listing issues within a project.
 * Supports filters: status (UNRESOLVED/RESOLVED), search (type/message), and pagination (page, limit).
 * Returns 404 if the project is not owned by the user.
 */
async function getProjectIssues(req, res) {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const { status, search } = req.query;

  // Validate status filter if provided
  if (status !== undefined && status !== 'UNRESOLVED' && status !== 'RESOLVED') {
    return res.status(400).json({ error: 'status must be UNRESOLVED or RESOLVED' });
  }

  // Parse pagination parameters
  let page = parseInt(req.query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  let limit = parseInt(req.query.limit, 10);
  if (isNaN(limit) || limit < 1) {
    limit = 20;
  } else if (limit > 100) {
    limit = 100;
  }

  const offset = (page - 1) * limit;

  try {
    const isOwner = await verifyProjectOwnership(projectId, req.user.id);
    if (!isOwner) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const conditions = ['i.project_id = $1', 'p.user_id = $2'];
    const queryParams = [projectId, req.user.id];

    if (status) {
      queryParams.push(status);
      conditions.push(`i.status = $${queryParams.length}`);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      queryParams.push(`%${search.trim()}%`);
      const searchParamIndex = queryParams.length;
      conditions.push(`(i.type ILIKE $${searchParamIndex} OR i.message ILIKE $${searchParamIndex})`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Total count query for pagination
    const countQuery = `
      SELECT COUNT(i.id)::int AS total
      FROM issues i
      JOIN projects p ON p.id = i.project_id
      ${whereClause};
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = countResult.rows[0].total;

    // Items query with pagination
    queryParams.push(limit);
    const limitParamIndex = queryParams.length;
    queryParams.push(offset);
    const offsetParamIndex = queryParams.length;

    const dataQuery = `
      SELECT
        i.id,
        i.project_id,
        i.fingerprint,
        i.type,
        i.message,
        i.status,
        i.events_count,
        i.first_seen,
        i.last_seen
      FROM issues i
      JOIN projects p ON p.id = i.project_id
      ${whereClause}
      ORDER BY i.last_seen DESC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex};
    `;
    const result = await pool.query(dataQuery, queryParams);

    return res.status(200).json({
      issues: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching project issues:', error);
    return res.status(500).json({ error: 'Failed to fetch project issues.' });
  }
}

/**
 * Controller for retrieving a single issue and historical event occurrences.
 * Scoped to user's project; returns 404 if not found or not owned.
 */
async function getProjectIssueById(req, res) {
  const projectId = parseInt(req.params.projectId, 10);
  const issueId = parseInt(req.params.issueId, 10);

  if (isNaN(projectId) || isNaN(issueId)) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  let limit = 50;
  if (req.query.limit !== undefined) {
    const parsedLimit = parseInt(req.query.limit, 10);
    if (!isNaN(parsedLimit)) {
      limit = Math.min(Math.max(parsedLimit, 1), 200);
    }
  }

  try {
    const issueQuery = `
      SELECT
        i.id,
        i.project_id,
        i.fingerprint,
        i.type,
        i.message,
        i.status,
        i.events_count,
        i.first_seen,
        i.last_seen
      FROM issues i
      JOIN projects p ON p.id = i.project_id
      WHERE i.id = $1 AND i.project_id = $2 AND p.user_id = $3;
    `;
    const issueResult = await pool.query(issueQuery, [issueId, projectId, req.user.id]);

    if (issueResult.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const eventsQuery = `
      SELECT id, project_id, issue_id, type, message, stack, timestamp, received_at
      FROM events
      WHERE issue_id = $1 AND project_id = $2
      ORDER BY received_at DESC
      LIMIT $3;
    `;
    const eventsResult = await pool.query(eventsQuery, [issueId, projectId, limit]);

    return res.status(200).json({
      issue: issueResult.rows[0],
      events: eventsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching issue details:', error);
    return res.status(500).json({ error: 'Failed to fetch issue details.' });
  }
}

/**
 * Controller for updating an issue status ('RESOLVED' or 'UNRESOLVED').
 * Scoped to user's project; returns 404 if not found or not owned.
 */
async function updateProjectIssueStatus(req, res) {
  const projectId = parseInt(req.params.projectId, 10);
  const issueId = parseInt(req.params.issueId, 10);
  const { status } = req.body || {};

  if (isNaN(projectId) || isNaN(issueId)) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  if (status !== 'RESOLVED' && status !== 'UNRESOLVED') {
    return res.status(400).json({ error: 'Status must be RESOLVED or UNRESOLVED' });
  }

  try {
    const updateQuery = `
      UPDATE issues i
      SET status = $1
      FROM projects p
      WHERE i.project_id = p.id
        AND i.id = $2
        AND i.project_id = $3
        AND p.user_id = $4
      RETURNING
        i.id,
        i.project_id,
        i.fingerprint,
        i.type,
        i.message,
        i.status,
        i.events_count,
        i.first_seen,
        i.last_seen;
    `;
    const result = await pool.query(updateQuery, [status, issueId, projectId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating issue status:', error);
    return res.status(500).json({ error: 'Failed to update issue.' });
  }
}

/**
 * Controller for deleting an issue.
 * Cascades to delete related events via foreign key.
 * Scoped to user's project; returns 404 if not found or not owned.
 */
async function deleteProjectIssue(req, res) {
  const projectId = parseInt(req.params.projectId, 10);
  const issueId = parseInt(req.params.issueId, 10);

  if (isNaN(projectId) || isNaN(issueId)) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  try {
    const deleteQuery = `
      DELETE FROM issues i
      USING projects p
      WHERE i.project_id = p.id
        AND i.id = $1
        AND i.project_id = $2
        AND p.user_id = $3
      RETURNING i.id;
    `;
    const result = await pool.query(deleteQuery, [issueId, projectId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    return res.status(200).json({ success: true, message: 'Issue deleted' });
  } catch (error) {
    console.error('Error deleting issue:', error);
    return res.status(500).json({ error: 'Failed to delete issue.' });
  }
}

module.exports = {
  getProjectStats,
  getProjectIssues,
  getProjectIssueById,
  updateProjectIssueStatus,
  deleteProjectIssue,
};
