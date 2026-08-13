// src/services/scoring.service.js
// All scoring/points logic lives here.
// Controllers never compute points directly.

const ScoringConfig = require('../models/ScoringConfig');

/**
 * Returns the currently active scoring configuration.
 * Falls back to sensible defaults if none found.
 */
const getActiveConfig = async () => {
  const config = await ScoringConfig.findOne({ isActive: true }).lean();
  return (
    config || {
      onTimePoints: 10,
      latePoints: 5,
      deadlineHourUTC: 18,
    }
  );
};

/**
 * Calculates points for a completed problem.
 * @param {Date} completedAt - when the student marked it complete
 * @param {Date} deadline - the problem's deadline
 * @param {object} config - scoring config (from getActiveConfig)
 * @returns {{ pointsEarned: number, isOnTime: boolean }}
 */
const calculatePoints = (completedAt, deadline, config) => {
  const isOnTime = new Date(completedAt) <= new Date(deadline);
  const pointsEarned = isOnTime ? config.onTimePoints : config.latePoints;
  return { pointsEarned, isOnTime };
};

module.exports = { getActiveConfig, calculatePoints };
