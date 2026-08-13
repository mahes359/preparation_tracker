// src/routes/index.js
// Master router — mounts all sub-routers under /api/v1

const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/students', require('./students.routes'));
router.use('/problems', require('./problems.routes'));
router.use('/leaderboard', require('./leaderboard.routes'));
router.use('/config', require('./config.routes'));

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
