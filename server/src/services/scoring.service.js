// src/services/scoring.service.js
const ScoringConfig = require('../models/ScoringConfig');
const Completion = require('../models/Completion');

const getActiveConfig = async () => {
  const config = await ScoringConfig.findOne({ isActive: true }).lean();
  return {
    ...(config || {}),
    firstPoints:          config?.firstPoints          ?? 15,
    secondPoints:         config?.secondPoints         ?? 12,
    standardPoints:       config?.standardPoints       ?? 10,
    lateSameDayPoints:    config?.lateSameDayPoints    ?? 6,
    lateOneDayPoints:     config?.lateOneDayPoints     ?? 3,
    lateTwoPlusDayPoints: config?.lateTwoPlusDayPoints ?? 1,
    deadlineHour:         config?.deadlineHour         ?? 23,
    deadlineMinute:       config?.deadlineMinute       ?? 59,
  };
};

/**
 * Calculates points for a completion.
 *
 * Scoring tiers:
 *   On-time (before deadline, same challenge day):
 *     1st completer in group  → firstPoints   (default 15)
 *     2nd completer           → secondPoints  (default 12)
 *     3rd+ completer          → standardPoints (default 10)
 *
 *   Late (after deadline):
 *     Same calendar day       → lateSameDayPoints  (default 6)
 *     1 day after             → lateOneDayPoints   (default 3)
 *     2+ days after           → lateTwoPlusDayPoints (default 1)
 *
 * @param {Date}   completedAt   - timestamp of completion
 * @param {Date}   deadline      - problem deadline
 * @param {string} challengeDate - YYYY-MM-DD of the challenge
 * @param {string} problemId     - to count prior completions in same group
 * @param {string|null} groupId  - group scope for position counting
 * @param {object} config        - from getActiveConfig()
 * @returns {{ pointsEarned: number, isOnTime: boolean, position: number }}
 */
const calculatePoints = async (completedAt, deadline, challengeDate, problemId, groupId, config) => {
  const now = new Date(completedAt);
  const dl = new Date(deadline);
  const isOnTime = now <= dl;

  if (isOnTime) {
    // Count how many others already completed this problem on-time before this student
    const priorCount = await Completion.countDocuments({
      problemId,
      completedAt: { $ne: null, $lt: now },
      isOnTime: true,
      ...(groupId ? { groupId } : {}),
    });

    // position is 1-based
    const position = priorCount + 1;
    let pointsEarned;
    if (position === 1)      pointsEarned = config.firstPoints;
    else if (position === 2) pointsEarned = config.secondPoints;
    else                     pointsEarned = config.standardPoints;

    return { pointsEarned, isOnTime: true, position };
  }

  // Late — calculate days past the challenge date
  // challengeDate is YYYY-MM-DD; compare calendar days
  const [cy, cm, cd] = challengeDate.split('-').map(Number);
  const challengeDay = new Date(Date.UTC(cy, cm - 1, cd));
  const completionDay = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()
  ));
  const daysLate = Math.round((completionDay - challengeDay) / 86400000);

  let pointsEarned;
  if (daysLate <= 0)      pointsEarned = config.lateSameDayPoints;    // same day, after deadline
  else if (daysLate === 1) pointsEarned = config.lateOneDayPoints;    // next day
  else                     pointsEarned = config.lateTwoPlusDayPoints; // 2+ days

  return { pointsEarned, isOnTime: false, position: null };
};

module.exports = { getActiveConfig, calculatePoints };
