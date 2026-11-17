const { pool } = require('../db');
const { generateFingerprint } = require('../fingerprint');

/**
 * Controller for ingesting error events.
 * Groups events by project_id and fingerprint into issues and stores the raw error occurrence.
 */
async function ingestEvent(req, res) {
  const { type, message, stack, timestamp } = req.body || {};

  // Validate required string fields after trim
  if (typeof type !== 'string' || type.trim() === '') {
    return res.status(400).json({
      error: 'Field "type" must be a non-empty string.',
    });
  }

  if (typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({
      error: 'Field "message" must be a non-empty string.',
    });
  }

  if (stack !== undefined && stack !== null && typeof stack !== 'string') {
    return res.status(400).json({
      error: 'Field "stack" must be a string.',
    });
  }

  // Validate timestamp: default to now if omitted, return 400 if invalid
  let eventTimestamp;
  if (timestamp === undefined || timestamp === null || (typeof timestamp === 'string' && timestamp.trim() === '')) {
    eventTimestamp = new Date();
  } else {
    const parsed = new Date(timestamp);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({
        error: 'Field "timestamp" must be a valid date.',
      });
    }
    eventTimestamp = parsed;
  }

  const eventType = type.trim().slice(0, 255);
  const eventMessage = message.trim();
  const eventStack = typeof stack === 'string' ? stack.trim() : '';

  // Use custom client fingerprint if provided; otherwise compute SHA-256 fingerprint
  const customFingerprint = req.body?.fingerprint;
  const issueFingerprint = (typeof customFingerprint === 'string' && customFingerprint.trim() !== '')
    ? (customFingerprint.trim().length <= 64
        ? customFingerprint.trim()
        : generateFingerprint({ type: eventType, message: customFingerprint.trim(), stack: '' }))
    : generateFingerprint({
        type: eventType,
        message: eventMessage,
        stack: eventStack,
      });

  // Exactly the same variable used for issue, event, and projects.last_event_at
  const projectId = req.projectId;

  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Group errors by project_id and fingerprint. If already seen, increment count and reset status to UNRESOLVED.
    const updateIssueQuery = `
      UPDATE issues
      SET events_count = events_count + 1,
          last_seen = NOW(),
          status = 'UNRESOLVED'
      WHERE project_id = $1 AND fingerprint = $2
      RETURNING id, events_count, status;
    `;
    let issueResult = await client.query(updateIssueQuery, [projectId, issueFingerprint]);
    let issue;

    if (issueResult.rowCount > 0) {
      issue = issueResult.rows[0];
    } else {
      const insertIssueQuery = `
        INSERT INTO issues (project_id, fingerprint, type, message, status, events_count, first_seen, last_seen)
        VALUES ($1, $2, $3, $4, 'UNRESOLVED', 1, NOW(), NOW())
        ON CONFLICT (project_id, fingerprint) DO NOTHING
        RETURNING id, events_count, status;
      `;
      issueResult = await client.query(insertIssueQuery, [
        projectId,
        issueFingerprint,
        eventType,
        eventMessage,
      ]);

      if (issueResult.rowCount > 0) {
        issue = issueResult.rows[0];
      } else {
        // If concurrent insert created the issue first, run the UPDATE once more
        issueResult = await client.query(updateIssueQuery, [projectId, issueFingerprint]);
        issue = issueResult.rows[0];
      }
    }

    // Insert event with project_id and issue_id from the same projectId variable
    const eventInsertQuery = `
      INSERT INTO events (project_id, issue_id, type, message, stack, timestamp, received_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, received_at;
    `;
    const eventResult = await client.query(eventInsertQuery, [
      projectId,
      issue.id,
      eventType,
      eventMessage,
      eventStack,
      eventTimestamp,
    ]);
    const event = eventResult.rows[0];

    // Update projects.last_event_at for that project inside the transaction
    const updateProjectLastEventQuery = `
      UPDATE projects
      SET last_event_at = NOW()
      WHERE id = $1;
    `;
    await client.query(updateProjectLastEventQuery, [projectId]);

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      issueId: issue.id,
      eventId: event.id,
      eventsCount: issue.events_count,
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error ingesting event:', error);
    return res.status(500).json({
      error: 'Failed to ingest event due to a database error.',
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}

module.exports = {
  ingestEvent,
};
