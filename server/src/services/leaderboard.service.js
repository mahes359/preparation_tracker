const mongoose = require('mongoose');
const Completion = require('../models/Completion');
const Student = require('../models/Student');
const Problem = require('../models/Problem');

const getLeaderboard = async () => {
  const aggregated = await Completion.aggregate([
    { $match: { completedAt: { $ne: null } } },
    { $group: {
      _id: '$studentId', totalPoints: { $sum: '$pointsEarned' }, completedCount: { $sum: 1 },
      onTimeCount: { $sum: { $cond: ['$isOnTime', 1, 0] } },
      lateCount: { $sum: { $cond: ['$isOnTime', 0, 1] } },
    } },
  ]);
  const allStudents = await Student.find({ isActive: true }).lean({ virtuals: true });
  const statsMap = new Map(aggregated.map((stat) => [stat._id.toString(), stat]));
  return allStudents.map((student) => ({ student, ...(statsMap.get(student._id.toString()) || {
    totalPoints: 0, completedCount: 0, onTimeCount: 0, lateCount: 0,
  }) })).sort((a, b) => b.totalPoints - a.totalPoints || b.onTimeCount - a.onTimeCount ||
    b.completedCount - a.completedCount || a.student.name.localeCompare(b.student.name))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
};

const getStudentStats = async (studentId) => {
  const objectId = new mongoose.Types.ObjectId(studentId);
  const [stats, questionsPosted, totalQuestions] = await Promise.all([
    Completion.aggregate([
    { $match: { studentId: objectId, completedAt: { $ne: null } } },
    { $group: {
      _id: '$studentId', totalPoints: { $sum: '$pointsEarned' },
      completedCount: { $sum: 1 }, onTimeCount: { $sum: { $cond: ['$isOnTime', 1, 0] } },
      lateCount: { $sum: { $cond: ['$isOnTime', 0, 1] } },
    } },
    ]),
    Problem.countDocuments({ studentId: objectId }),
    Problem.countDocuments(),
  ]);
  const completed = stats?.completedCount || 0;
  return {
    totalPoints: stats?.totalPoints || 0,
    questionsPosted,
    totalQuestions,
    completedCount: completed,
    pendingCount: Math.max(totalQuestions - completed, 0),
    onTimeCount: stats?.onTimeCount || 0,
    lateCount: stats?.lateCount || 0,
  };
};

const getGroupStats = async () => {
  const [questionsPosted, activeStudents, completionStats] = await Promise.all([
    Problem.countDocuments(),
    Student.countDocuments({ isActive: true }),
    Completion.aggregate([
      { $match: { completedAt: { $ne: null } } },
      { $group: {
        _id: null,
        totalPoints: { $sum: '$pointsEarned' },
        totalCompleted: { $sum: 1 },
        onTime: { $sum: { $cond: ['$isOnTime', 1, 0] } },
        late: { $sum: { $cond: ['$isOnTime', 0, 1] } },
      } },
    ]),
  ]);
  return {
    questionsPosted,
    totalCompletions: completionStats[0]?.totalCompleted || 0,
    totalRequiredCompletions: questionsPosted * activeStudents,
    completionRate: questionsPosted * activeStudents
      ? Math.round(((completionStats[0]?.totalCompleted || 0) / (questionsPosted * activeStudents)) * 100)
      : 0,
    onTimeCompletions: completionStats[0]?.onTime || 0,
    lateCompletions: completionStats[0]?.late || 0,
  };
};

const getStudentHistory = async (studentId, limit = 30) => {
  const records = await Completion.find({ studentId, completedAt: { $ne: null } }).populate('problemId').sort({ completedAt: -1 }).limit(limit).lean();
  return records.filter(({ problemId }) => problemId).map((record) => ({
    ...record.problemId, date: record.problemId.challengeDate || record.problemId.date,
    isCompleted: true, isOnTime: record.isOnTime, pointsEarned: record.pointsEarned,
  }));
};

module.exports = { getLeaderboard, getGroupStats, getStudentStats, getStudentHistory };
