const { pool } = require('../db');

/**
 * Controller for retrieving aggregate metrics (total, unresolved, resolved, occurrences).
 */
async function getStats(req, res) {
  try {
    const statsQuery = `
      SELECT
        COUNT(*)::int AS total_issues,
        COUNT(*) FILTER (WHERE status = 'UNRESOLVED')::int AS unresolved_issues,
        COUNT(*) FILTER (WHERE status = 'RESOLVED')::int AS resolved_issues,
        COALESCE(SUM(events_count), 0)::int AS total_events
      FROM issues;
    `;
    const result = await pool.query(statsQuery);
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching issue stats:', error);
    return res.status(500).json({ error: 'Failed to fetch issue statistics.' });
  }
}

/**
 * Controller for listing issues with optional status filtering.
 * Limits results to the 100 most recently seen issues.
 */
async function getIssues(req, res) {
  const { status } = req.query;

  // Validate status if present
  if (status !== undefined && status !== 'UNRESOLVED' && status !== 'RESOLVED') {
    return res.status(400).json({ error: 'status must be UNRESOLVED or RESOLVED' });
  }

  try {
    let queryText = `
      SELECT id, fingerprint, type, message, status, events_count, first_seen, last_seen
      FROM issues
    `;
    const queryParams = [];

    if (status) {
      queryParams.push(status);
      queryText += ` WHERE status = $1`;
    }

    queryText += ` ORDER BY last_seen DESC LIMIT 100;`;

    const result = await pool.query(queryText, queryParams);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching issues:', error);
    return res.status(500).json({ error: 'Failed to fetch issues.' });
  }
}

/**
 * Controller for retrieving a single issue and historical event occurrences.
 * Supports an optional clamped limit (1 to 200, default 50).
 */
async function getIssueById(req, res) {
  const issueId = parseInt(req.params.id, 10);
  if (isNaN(issueId)) {
    return res.status(400).json({ error: 'Invalid issue ID' });
  }

  // Parse and clamp event limit between 1 and 200 (default 50)
  let limit = 50;
  if (req.query.limit !== undefined) {
    const parsedLimit = parseInt(req.query.limit, 10);
    if (!isNaN(parsedLimit)) {
      limit = Math.min(Math.max(parsedLimit, 1), 200);
    }
  }

  try {
    const issueResult = await pool.query('SELECT * FROM issues WHERE id = $1', [issueId]);
    if (issueResult.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const eventsResult = await pool.query(
      'SELECT id, type, message, stack, timestamp, received_at FROM events WHERE issue_id = $1 ORDER BY received_at DESC LIMIT $2',
      [issueId, limit]
    );

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
 */
async function updateIssueStatus(req, res) {
  const issueId = parseInt(req.params.id, 10);
  const { status } = req.body || {};

  if (isNaN(issueId)) {
    return res.status(400).json({ error: 'Invalid issue ID' });
  }

  if (status !== 'RESOLVED' && status !== 'UNRESOLVED') {
    return res.status(400).json({ error: 'Status must be RESOLVED or UNRESOLVED' });
  }

  try {
    const updateResult = await pool.query(
      'UPDATE issues SET status = $1 WHERE id = $2 RETURNING *',
      [status, issueId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    return res.status(200).json(updateResult.rows[0]);
  } catch (error) {
    console.error('Error updating issue status:', error);
    return res.status(500).json({ error: 'Failed to update issue.' });
  }
}

module.exports = {
  getStats,
  getIssues,
  getIssueById,
  updateIssueStatus,
};
