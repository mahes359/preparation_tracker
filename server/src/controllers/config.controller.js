// src/controllers/config.controller.js
const ScoringConfig = require('../models/ScoringConfig');
const asyncHandler = require('../middleware/asyncHandler');
const { getActiveConfig } = require('../services/scoring.service');

const getScoringConfig = asyncHandler(async (req, res) => {
  const config = await getActiveConfig();
  res.json({ success: true, data: config });
});

const updateScoringConfig = asyncHandler(async (req, res) => {
  const {
    firstPoints, secondPoints, standardPoints,
    lateSameDayPoints, lateOneDayPoints, lateTwoPlusDayPoints,
    deadlineHour, deadlineMinute, description,
  } = req.body;

  await ScoringConfig.updateMany({ isActive: true }, { isActive: false });

  const newConfig = await ScoringConfig.create({
    firstPoints, secondPoints, standardPoints,
    lateSameDayPoints, lateOneDayPoints, lateTwoPlusDayPoints,
    deadlineHour, deadlineMinute, description,
    isActive: true,
  });

  res.status(201).json({
    success: true,
    message: 'Scoring configuration updated. New rules apply to future completions.',
    data: newConfig,
  });
});

module.exports = { getScoringConfig, updateScoringConfig };
