const express = require('express');
const {
  getStats,
  getIssues,
  getIssueById,
  updateIssueStatus,
  deleteIssue,
} = require('../controllers/issues');

const router = express.Router();

router.get('/stats', getStats);
router.get('/', getIssues);
router.get('/:id', getIssueById);
router.patch('/:id', updateIssueStatus);
router.delete('/:id', deleteIssue);

module.exports = router;
