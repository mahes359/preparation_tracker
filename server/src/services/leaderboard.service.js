// src/services/leaderboard.service.js
// Aggregation pipeline for real-time leaderboard rankings.

const Problem = require('../models/Problem');
const Student = require('../models/Student');

/**
 * Computes the all-time leaderboard (overall rankings).
 * Ties broken by: onTimeCount DESC → completedCount DESC → name ASC
 */
const getLeaderboard = async () => {
  // Step 1: Aggregate points and counts per student from completed problems
  const aggregated = await Problem.aggregate([
    { $match: { isCompleted: true } },
    {
      $group: {
        _id: '$studentId',
        totalPoints: { $sum: '$pointsEarned' },
        completedCount: { $sum: 1 },
        onTimeCount: { $sum: { $cond: ['$isOnTime', 1, 0] } },
        lateCount: { $sum: { $cond: ['$isOnTime', 0, 1] } },
      },
    },
    { $sort: { totalPoints: -1, onTimeCount: -1, completedCount: -1 } },
  ]);

  // Step 2: Get all active students (so students with 0 points still appear)
  const allStudents = await Student.find({ isActive: true }).lean({ virtuals: true });

  // Step 3: Merge — students with no completed problems get zero stats
  const statsMap = new Map(aggregated.map((s) => [s._id.toString(), s]));

  const rankings = allStudents
    .map((student) => {
      const stats = statsMap.get(student._id.toString()) || {
        totalPoints: 0,
        completedCount: 0,
        onTimeCount: 0,
        lateCount: 0,
      };
      return { student, ...stats };
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.onTimeCount !== a.onTimeCount) return b.onTimeCount - a.onTimeCount;
      if (b.completedCount !== a.completedCount) return b.completedCount - a.completedCount;
      return a.student.name.localeCompare(b.student.name);
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return rankings;
};

/**
 * Gets a single student's personal stats.
 */
const getStudentStats = async (studentId) => {
  const [stats] = await Problem.aggregate([
    { $match: { studentId: new (require('mongoose').Types.ObjectId)(studentId) } },
    {
      $group: {
        _id: '$studentId',
        totalPoints: { $sum: '$pointsEarned' },
        totalProblems: { $sum: 1 },
        completedCount: { $sum: { $cond: ['$isCompleted', 1, 0] } },
        onTimeCount: { $sum: { $cond: ['$isOnTime', 1, 0] } },
        lateCount: {
          $sum: {
            $cond: [{ $and: ['$isCompleted', { $eq: ['$isOnTime', false] }] }, 1, 0],
          },
        },
        pendingCount: { $sum: { $cond: ['$isCompleted', 0, 1] } },
      },
    },
  ]);

  return (
    stats || {
      totalPoints: 0,
      totalProblems: 0,
      completedCount: 0,
      onTimeCount: 0,
      lateCount: 0,
      pendingCount: 0,
    }
  );
};

/**
 * Returns daily problem history for a student (for profile page).
 */
const getStudentHistory = async (studentId, limit = 30) => {
  return Problem.find({ studentId })
    .sort({ date: -1 })
    .limit(limit)
    .lean();
};

module.exports = { getLeaderboard, getStudentStats, getStudentHistory };
