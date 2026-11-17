const { pool } = require('../db');
const { cleanLocation } = require('../fingerprint');

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

/**
 * Extract exact code location (function, file, line, column) from stack trace.
 */
function extractLocation(stack) {
  if (!stack || typeof stack !== 'string') return null;
  const lines = stack.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // V8 format: 'at functionName (filePath:line:col)' or 'at filePath:line:col'
    const v8Match = trimmed.match(/^at (?:(.+?)\s+\((.+):(\d+):(\d+)\)|(.+):(\d+):(\d+))$/);
    if (v8Match) {
      const rawFile = v8Match[2] || v8Match[5] || '';
      return {
        functionName: v8Match[1] || '<anonymous>',
        file: cleanLocation(rawFile),
        rawFile,
        line: parseInt(v8Match[3] || v8Match[6], 10),
        column: parseInt(v8Match[4] || v8Match[7], 10),
      };
    }

    // Firefox / Safari format: 'fn@file:line:col' or '@file:line:col'
    if (trimmed.includes('@')) {
      const atIdx = trimmed.indexOf('@');
      const fn = trimmed.slice(0, atIdx).trim();
      const loc = trimmed.slice(atIdx + 1).trim();
      const match = loc.match(/^(.*):(\d+):(\d+)$/);
      if (match && !fn.includes(':')) {
        return {
          functionName: fn || '<anonymous>',
          file: cleanLocation(match[1]),
          rawFile: match[1],
          line: parseInt(match[2], 10),
          column: parseInt(match[3], 10),
        };
      }
    }
  }
  return null;
}

/**
 * Generate structured explanation when Gemini API is unavailable or unconfigured.
 */
function generateLocalExplanation(issue, event, location) {
  let locationSection = '';
  if (location && location.file) {
    locationSection = `The error was triggered in **\`${location.file}\`** at **Line ${location.line}**, **Column ${location.column}** inside function **\`${location.functionName}()\`**.\n\nExecution stopped at this line when the runtime encountered an unexpected state.`;
  } else {
    locationSection = `The error was captured with message \`${issue.message}\`, but exact line coordinates could not be isolated from the stack frames.`;
  }

  let rootCause = '';
  let fix = '';

  const msg = issue.message || '';
  const type = issue.type || '';

  if (type === 'TypeError' && (msg.includes('Cannot read properties of undefined') || msg.includes('is not a function'))) {
    const propMatch = msg.match(/reading '(.+?)'/) || msg.match(/(\w+) is not a function/);
    const prop = propMatch ? `\`${propMatch[1]}\`` : 'the property/method';
    rootCause = `The application attempted to invoke or access ${prop} on a target that resolved to \`undefined\` or was not initialized in memory at that moment.`;
    fix = `Use optional chaining (\`?.\`) or ensure the parent object is defined before accessing its property:
\`\`\`javascript
// Safe navigation with optional chaining:
const value = target?.${propMatch ? propMatch[1] : 'property'};

// Defensive guard clause:
if (target && typeof target.${propMatch ? propMatch[1] : 'property'} === 'function') {
  target.${propMatch ? propMatch[1] : 'property'}();
}
\`\`\``;
  } else if (type === 'ReferenceError' && msg.includes('is not defined')) {
    const varMatch = msg.match(/^(.+?) is not defined/);
    const varName = varMatch ? `\`${varMatch[1]}\`` : 'the variable';
    rootCause = `${varName} was accessed before being defined, or is outside the current scope.`;
    fix = `Check if ${varName} is spelled correctly and ensure it is declared in an accessible scope before this line executes:
\`\`\`javascript
const ${varMatch ? varMatch[1] : 'variable'} = /* initialize value */;
\`\`\``;
  } else if (msg.includes('JSON')) {
    rootCause = `JSON deserialization failed because the input string received was not valid JSON format.`;
    fix = `Wrap the JSON parsing call with a try-catch block to handle unexpected payloads gracefully:
\`\`\`javascript
try {
  const parsed = JSON.parse(rawResponse);
} catch (err) {
  console.error('Failed to parse JSON:', err);
}
\`\`\``;
  } else {
    rootCause = `A \`${type}\` exception was thrown with message: "${msg}".`;
    fix = `Inspect the call stack at line ${location?.line || 'above'} to verify input values, types, and asynchronous timing.`;
  }

  return `### 📍 Exact Location
${locationSection}

### 🔍 Root Cause
${rootCause}

### 💡 Suggested Fix
${fix}

> 💡 *Tip: Configure \`GEMINI_API_KEY\` in your environment or enter your key to unlock live AI code repairs and architectural insights.*`;
}

/**
 * Controller for explaining an issue using Google Gemini AI.
 * Explains the exact location (file, line, column, function), root cause, and suggested fix.
 */
async function explainProjectIssue(req, res) {
  const projectId = parseInt(req.params.projectId, 10);
  const issueId = parseInt(req.params.issueId, 10);

  if (isNaN(projectId) || isNaN(issueId)) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  try {
    const isOwner = await verifyProjectOwnership(projectId, req.user.id);
    if (!isOwner) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const issueResult = await pool.query(
      'SELECT id, project_id, fingerprint, type, message, status, events_count, first_seen, last_seen FROM issues WHERE id = $1 AND project_id = $2',
      [issueId, projectId]
    );

    if (issueResult.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const issue = issueResult.rows[0];

    const eventsResult = await pool.query(
      'SELECT id, project_id, issue_id, type, message, stack, timestamp, received_at FROM events WHERE issue_id = $1 AND project_id = $2 ORDER BY received_at DESC LIMIT 1',
      [issueId, projectId]
    );

    const latestEvent = eventsResult.rows[0] || null;
    const stack = latestEvent?.stack || '';
    const location = extractLocation(stack);

    const geminiApiKey = req.body?.apiKey || process.env.GEMINI_API_KEY;
    let explanation = null;
    let source = 'parsed';

    if (geminiApiKey) {
      try {
        const prompt = `You are an expert software engineer and automated debugging assistant in the Faultline error tracking platform.
A developer clicked "Explain with Gemini" to understand an error.
Your task is to explain to the user EXACTLY WHERE the error occurred in the code, WHY it occurred, and HOW to fix it.

Error Details:
- Error Type: ${issue.type}
- Error Message: ${issue.message}
- Detected Location: ${location ? `File "${location.file}" (line ${location.line}, col ${location.column}) in function "${location.functionName}"` : 'Location could not be automatically detected'}

Raw Stack Trace:
${stack || 'No stack trace available.'}

Respond with clear markdown with the following structure:
### 📍 Exact Location
State clearly the exact file, function/method, and line number where the execution broke. Explain what statement or operation failed at that spot.

### 🔍 Root Cause
Explain in clear, friendly terms why the runtime threw this error.

### 💡 Suggested Fix
Provide a direct, concrete code solution or snippet showing how to resolve the problem.`;

        const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
        for (const model of models) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiApiKey.trim())}`;
            const apiRes = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
            });

            if (apiRes.ok) {
              const data = await apiRes.json();
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                explanation = text;
                source = 'gemini';
                break;
              }
            }
          } catch (modelErr) {
            console.warn(`Gemini call to ${model} failed:`, modelErr.message);
          }
        }
      } catch (geminiErr) {
        console.error('Gemini explanation error:', geminiErr);
      }
    }

    if (!explanation) {
      explanation = generateLocalExplanation(issue, latestEvent, location);
    }

    return res.status(200).json({
      success: true,
      source,
      location,
      explanation,
    });
  } catch (error) {
    console.error('Error generating error explanation:', error);
    return res.status(500).json({ error: 'Failed to generate explanation.' });
  }
}

module.exports = {
  getProjectStats,
  getProjectIssues,
  getProjectIssueById,
  updateProjectIssueStatus,
  deleteProjectIssue,
  explainProjectIssue,
  extractLocation,
};
