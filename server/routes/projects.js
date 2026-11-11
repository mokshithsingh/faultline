const express = require('express');
const {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  regenerateApiKey,
} = require('../controllers/projects');
const { getProjectStats } = require('../controllers/issues');
const issuesRouter = require('./issues');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All project routes require authentication
router.use(requireAuth);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProjectById);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/regenerate-key', regenerateApiKey);

// Project-scoped stats and issues
router.get('/:projectId/stats', getProjectStats);
router.use('/:projectId/issues', issuesRouter);

module.exports = router;
