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
 */
async function getIssues(req, res) {
  const { status } = req.query;

  try {
    let queryText = `
      SELECT id, fingerprint, type, message, status, events_count, first_seen, last_seen
      FROM issues
    `;
    const queryParams = [];

    if (status && (status === 'UNRESOLVED' || status === 'RESOLVED')) {
      queryParams.push(status);
      queryText += ` WHERE status = $1`;
    }

    queryText += ` ORDER BY last_seen DESC;`;

    const result = await pool.query(queryText, queryParams);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching issues:', error);
    return res.status(500).json({ error: 'Failed to fetch issues.' });
  }
}

/**
 * Controller for retrieving a single issue and all its historical event occurrences.
 */
async function getIssueById(req, res) {
  const issueId = parseInt(req.params.id, 10);
  if (isNaN(issueId)) {
    return res.status(400).json({ error: 'Invalid issue ID' });
  }

  try {
    const issueResult = await pool.query('SELECT * FROM issues WHERE id = $1', [issueId]);
    if (issueResult.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const eventsResult = await pool.query(
      'SELECT id, type, message, stack, timestamp, received_at FROM events WHERE issue_id = $1 ORDER BY received_at DESC',
      [issueId]
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

/**
 * Controller for deleting an issue and cascading deletion to its child events.
 */
async function deleteIssue(req, res) {
  const issueId = parseInt(req.params.id, 10);
  if (isNaN(issueId)) {
    return res.status(400).json({ error: 'Invalid issue ID' });
  }

  try {
    const result = await pool.query('DELETE FROM issues WHERE id = $1 RETURNING id', [issueId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    return res.status(200).json({ success: true, deletedId: issueId });
  } catch (error) {
    console.error('Error deleting issue:', error);
    return res.status(500).json({ error: 'Failed to delete issue.' });
  }
}

module.exports = {
  getStats,
  getIssues,
  getIssueById,
  updateIssueStatus,
  deleteIssue,
};
