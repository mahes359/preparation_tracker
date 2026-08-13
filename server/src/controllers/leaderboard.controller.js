// src/controllers/leaderboard.controller.js

const asyncHandler = require('../middleware/asyncHandler');
const { getLeaderboard } = require('../services/leaderboard.service');

const getLeaderboardHandler = asyncHandler(async (req, res) => {
  const rankings = await getLeaderboard();
  res.json({
    success: true,
    asOf: new Date().toISOString(),
    data: rankings,
  });
});

module.exports = { getLeaderboardHandler };
