const assert = require('node:assert/strict');
const { buildStudentStatsSummary, buildDailyProgressForStudent, calculateCurrentStreak } = require('../src/services/leaderboard.service');

const stats = buildStudentStatsSummary({
  questionsPosted: 2,
  totalQuestions: 4,
  completedCount: 3,
  totalPoints: 30,
  onTimeCount: 2,
  lateCount: 1,
  activeMembers: 3,
});

assert.equal(stats.questionsPosted, 2);
assert.equal(stats.completedCount, 3);
assert.equal(stats.pendingCount, 1);
assert.equal(stats.completionRate, 75);
assert.equal(stats.totalQuestions, 4);

const dailyProgress = buildDailyProgressForStudent([
  { date: '2026-08-16', totalQuestions: 3, completed: 3, pending: 0, completionRate: 100, onTime: 2, late: 1, points: 18 },
  { date: '2026-08-15', totalQuestions: 3, completed: 2, pending: 1, completionRate: 67, onTime: 2, late: 0, points: 12 },
  { date: '2026-08-14', totalQuestions: 3, completed: 2, pending: 1, completionRate: 67, onTime: 1, late: 1, points: 10 },
]);

assert.equal(dailyProgress.length, 3);
assert.equal(dailyProgress[0].date, '2026-08-16');
assert.equal(calculateCurrentStreak(dailyProgress), 1);

console.log('leaderboard.service tests passed');
