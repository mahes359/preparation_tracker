// src/controllers/leaderboard.controller.js

const asyncHandler = require('../middleware/asyncHandler');
const { getLeaderboard, getGroupStats } = require('../services/leaderboard.service');

const getLeaderboardHandler = asyncHandler(async (req, res) => {
  const [rankings, groupStats] = await Promise.all([getLeaderboard(), getGroupStats()]);
  res.json({
    success: true,
    asOf: new Date().toISOString(),
    data: rankings,
    groupStats,
  });
});

module.exports = { getLeaderboardHandler };
