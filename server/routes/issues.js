const express = require('express');
const {
  getProjectIssues,
  getProjectIssueById,
  updateProjectIssueStatus,
  deleteProjectIssue,
  explainProjectIssue,
} = require('../controllers/issues');

const router = express.Router({ mergeParams: true });

// Routes scoped under /api/projects/:projectId/issues
router.get('/', getProjectIssues);
router.get('/:issueId', getProjectIssueById);
router.patch('/:issueId', updateProjectIssueStatus);
router.delete('/:issueId', deleteProjectIssue);
router.post('/:issueId/explain', explainProjectIssue);

module.exports = router;
