// src/routes/leaderboard.routes.js

const router = require('express').Router();
const { getLeaderboardHandler } = require('../controllers/leaderboard.controller');

router.get('/', getLeaderboardHandler);

module.exports = router;
